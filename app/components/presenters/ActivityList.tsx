import React, {
  Component,
  Fragment,
} from 'react';

import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import { ActivityListProps } from 'containers/ActivityListContainer';
import LabelContainer from 'containers/LabelContainer';
import NowClockContainer from 'containers/NowClockContainer';
import constants from 'lib/constants';
import { centerline } from 'lib/selectors';
import store from 'lib/store';
import utils from 'lib/utils';
import ActivityListItem from 'presenters/ActivityListItem';
import { labelTextStyle } from 'presenters/Label';
import { ActivityDataExtended } from 'shared/activities';
import log from 'shared/log';
import { Timepoint } from 'shared/timeseries';

const colors = constants.colors.activityList;
const {
  activityHeight,
  activityMargin,
  activityWidth,
  centerLineTop,
  centerLineWidth,
  height,
  topBottomBorderHeight
} = constants.activityList;

const Styles = StyleSheet.create({
  box: {
    backgroundColor: colors.background,
    height,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  text: {
    alignSelf: 'flex-end',
    color: colors.text,
    fontWeight: 'bold',
    margin: 2,
    marginRight: 4,
  },
  borderLine: { // multiple instances of these above and below ActivityList, similar to what's above Timeline
    backgroundColor: colors.borderLine,
    position: 'absolute',
    width: utils.windowSize().width,
    height: constants.activityList.borderLineHeight,
  },
  centerLine: { // These are vertical.
    backgroundColor: colors.centerLine,
  },
  centerLineBright: {
    backgroundColor: colors.centerLineBright,
  },
  centerLineCurrent: {
    backgroundColor: colors.centerLineCurrent,
  },
  centerLineSelected:{
    backgroundColor: colors.centerLineSelected,
  },
  labelView: {
    left: constants.clock.width / 2 - 1, // TODO this is the right place, though it's a brittle calculation
    bottom: 5,
  },
})

const listMarginLeft = centerline(); // allows list to be positioned such that left edge of real content is centered.
const listMarginRight = centerline(); // allows list to be positioned such that right edge of real content is centered.

// note the left margin of the first activity is effectively the right margin of listHeaderStyle
const listHeaderStyle = {
  backgroundColor: colors.backgroundMarginPast,
  borderRadius: 0,
  width: listMarginLeft,
  height: activityHeight,
}
const listFooterBaseStyle = {
  ...listHeaderStyle,
  backgroundColor: colors.backgroundMarginFuture,
  marginLeft: activityMargin,
  width: listMarginRight,
}
const listFooterNowNotTrackingStyle = {
  ...listFooterBaseStyle,
  marginLeft: activityMargin / 2,
}
const listFooterTrackingStyle = {
  ...listHeaderStyle,
  backgroundColor: colors.backgroundMarginFuture,
  width: listMarginRight,
}
const listFooterClockStyle = {
  marginLeft: 0,
}

// The basic layout of this horizontal list is simple: margins flanking N boxes, each with activityMargin.
// marginLeft (activityMargin activityWidth)* marginRight
const getItemLayout = (data: ActivityDataExtended[] | null | undefined, index: number) => (
  {
    index,
    length: (activityMargin + activityWidth),
    offset: listMarginLeft + (index * (activityMargin + activityWidth)),
  }
)

let _ref: FlatList<ActivityDataExtended>;

interface ActivityListState {
  scrolledBetweenActivities: boolean; // note it's possible to scroll between activities without deselecting an activity
  // and in that case this will ensure we draw the vertical line as appropriate when between activities.
}

class ActivityList extends Component<ActivityListProps, ActivityListState> {

  constructor(props: ActivityListProps) {
    super(props);
    this.autoScroll = this.autoScroll.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleScrollEndDrag = this.handleScrollEndDrag.bind(this);
    this.renderItem = this.renderItem.bind(this);
    this.scrollToTime = this.scrollToTime.bind(this);
    this.state = {
      scrolledBetweenActivities: false,
    } as ActivityListState;
  }

  autoScroll() {
    const state = store.getState(); // TODO not great form to grab state straight from here but
    const scrollTime = state.options.scrollTime; // this may change rapidly and we just want the latest we can get.
    if (scrollTime) {
      log.scrollEvent('ActivityList autoScroll', 'refreshCount', this.props.refreshCount,
        'length', this.props.list.length);
      this.scrollToTime(scrollTime);
    }
  }

  // TODO factor out the code that computes offsets from the code that does scrolling imperatively.

  // Handle ActivityList scroll event.
  // This often causes Timeline to scroll to stay synced up, and will also enable timelineNow if you scroll to the end.
  handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { x } = event.nativeEvent.contentOffset;
    log.scrollEvent('ActivityList handleScroll', x);
    // const now = utils.now();
    // const { timeStamp } = event;
    // log.trace('ActivityList handleScroll', x, timeStamp, new Date(timeStamp).toString(), now, msecToString(now - timeStamp));

    const { list } = this.props;

    // ActivityList has been scrolled to position x. Convert to Timepoint and pass to onScroll.
    // If x is on/within an activity, then position t is within the activity's time range, and is set proportionally.
    // Before all activities maps to the start of the first activity
    // After all activities maps to the end of the last one.
    // Between activities, no scroll is propagated to the timeline.
    const totalWidthPerActivity = activityMargin + activityWidth;
    const baseX = x - activityMargin;
    const ratio = baseX / totalWidthPerActivity;
    const index = Math.floor(ratio);
    const remainder = baseX - (index * totalWidthPerActivity);
    const proportion = remainder / activityWidth;
    const activity = list[index];
    if (activity && activity.tTotal && proportion <= 1) { // if scrolled within an activity
      const timeWithinActivity = proportion * activity.tTotal;
      const t: Timepoint = activity.tStart + timeWithinActivity;
      log.scrollEvent('handleScroll', baseX, ratio, index, proportion, timeWithinActivity, t);
      this.props.onScrollTimeline(t);
      this.setState({ scrolledBetweenActivities: false });
    } else {
      log.scrollEvent('handleScroll outside activity', baseX, ratio, index, proportion);
    }
    const xScrolledAfterActivity = remainder - activityWidth;
    // The +-1 below is a slight fudge factor so there's at least a couple of unclaimed pixels left in the center.
    const xLeftSelectStart = (activityMargin / 2 - 2); // amount left of an activity you can scroll to select start
    const xRightSelectEnd = (activityMargin / 2 + 2); // amount right of an activity you can scroll to select end

    if ((list.length && index >= list.length) || // if way at the end...
                                (index === list.length - 1 && // ...or if in right half of last margin after activities
                                 proportion > 1 &&
                                 xScrolledAfterActivity > xLeftSelectStart)) {
      log.debug('ActivityList handleScroll reachedEnd');
    } else if (proportion > 1) {
      log.scrollEvent('ActivityList handleScroll: proportion', proportion,
        'amountScrolledAfterActivity', xScrolledAfterActivity, 'index', index, 'remainder', remainder);
      if (activity && activity.tEnd && (xScrolledAfterActivity <= xLeftSelectStart)) {
        const { tLast } = activity;
        if (tLast) {
          this.props.onScrollTimeline(tLast); // This may change selectedActivityId.
          this.setState({ scrolledBetweenActivities: false });
        }
      } else if ((activity || index === -1) && xScrolledAfterActivity >= xRightSelectEnd) {
        // Note the -1 case above handles the margin just to the left of the first activity.
        if (list.length) {
          const nextActivity = list[index + 1];
          if (nextActivity) {
            const tStart = nextActivity.tStart;
            if (tStart) {
              this.props.onScrollTimeline(tStart); // This may change selectedActivityId.
              this.setState({ scrolledBetweenActivities: false });
            }
          } else {
            this.props.onPressFutureZone();
            this.setState({ scrolledBetweenActivities: false });
          }
        }
      } else {
        // Exactly in the center - which is where you will get put if you scroll the Timeline out of activity bounds.
        // This is the only scenario where scrolledBetweenActivities gets set to true.
        this.setState({ scrolledBetweenActivities: true });
      }
    }
  }

  handleScrollBeginDrag(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { x } = event.nativeEvent.contentOffset;
    log.scrollEvent('ActivityList handleScrollBeginDrag', x);
  }

  handleScrollEndDrag(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { x } = event.nativeEvent.contentOffset;
    log.scrollEvent('ActivityList handleScrollEndDrag', x);
    const { list } = this.props;
    const totalWidthPerActivity = activityMargin + activityWidth;
    const baseX = x - activityMargin;
    const ratio = baseX / totalWidthPerActivity;
    const index = Math.floor(ratio);
    const remainder = baseX - (index * totalWidthPerActivity);
    const proportion = remainder / activityWidth;
    const xScrolledAfterActivity = remainder - activityWidth;
    const xRightSelectEnd = (activityMargin / 2 + 2); // amount right of an activity you can scroll to select end
    if (index >= list.length || ((index === list.length - 1) && (proportion > 1))) {
      const { list } = this.props;
      if ((index === list.length - 1) && (xScrolledAfterActivity <= xRightSelectEnd && list[index].tEnd)) {
        this.props.onScrollTimeline(list[list.length - 1].tLast); // This may change selectedActivityId.
        this.setState({ scrolledBetweenActivities: false });
      } else {
        this.props.onPressFutureZone();
        this.setState({ scrolledBetweenActivities: false });
      }
    }
  }

  // Note the layout of this component currently assumes each activity (with the possible exception of currentActivity)
  // is of equal width, height, etc., and all activities are flanked on the left by a header component and on the right
  // by a footer component. There are pairs of fixed borderLines and a centerLine that has slight variations in color
  // to match past and current activities, or neutral color if there is no selected activity. The interaction between
  // this component and the Timeline is complex as it happens two ways: through ordinary React component updates, and
  // through scroll events propagated between the two controls so they remain in sync regarding the selected timepoint.

  render() {
    utils.addToCount('renderActivityList');
    const scrollInsets = { top: 0, bottom: 0, left: 0, right: 0 };
    const {
      currentActivityId,
      labelsEnabled,
      list,
      selectedActivityId,
      timelineNow,
      top,
      trackingActivity,
      visible,
    } = this.props;
    const { scrolledBetweenActivities } = this.state;
    const selectedIsCurrent = (selectedActivityId === currentActivityId);
    const centerLineLeft = centerline() - centerLineWidth / 2;
    const centerLineRight = centerLineLeft; // these are offsets from the edges, not absolute positions.
    const centerLineBase = {
      left: centerLineLeft,
      right: centerLineRight,
      height: height + constants.buttonOffset,
      position: 'absolute',
      top: centerLineTop,
    } as any;
    // Finesse position of NowClock when labels enabled vs disabled.
    const labelBottom = constants.activityList.nowClockLabelBottom;
    const clockBottom = labelsEnabled ? labelBottom : -1.5;
    const pointerEvents = visible ? 'auto' : 'none';
    return (
      <View pointerEvents={pointerEvents} style={[Styles.box, { top }, visible ? {} : { opacity: 0 }]}>
        <View pointerEvents="none" style={[Styles.borderLine, { top: 0 }]} />
        <View pointerEvents="none" style={[Styles.borderLine, { top: 2 }]} />
        <View pointerEvents="none" style={[Styles.borderLine, { top: topBottomBorderHeight + activityHeight + 2 }]} />
        <View pointerEvents="none" style={[Styles.borderLine, { top: topBottomBorderHeight + activityHeight + 4 }]} />
        {!selectedActivityId || (!selectedActivityId && scrolledBetweenActivities) || timelineNow ?
          <View
            pointerEvents="none"
            style={[centerLineBase, timelineNow ? Styles.centerLineCurrent : Styles.centerLineBright]}
          />
          :
          <Fragment>
            <View
              pointerEvents="none"
              style={[
                centerLineBase,
                selectedIsCurrent ? Styles.centerLineCurrent : Styles.centerLineSelected,
              ]}
            />
            <View pointerEvents="none" style={[centerLineBase, Styles.centerLine]} />
          </Fragment>
        }
        <FlatList<ActivityDataExtended>
          data={list}
          extraData={this.props /* TODO does this help? */}
          getItemLayout={getItemLayout}
          horizontal
          initialNumToRender={list.length /* TODO does this help? *}
          initialScrollIndex={Math.max(0, list.length - 1) /* end of list, for starters */}
          ListHeaderComponent={/* on far left of ActivityList */
            <View style={listHeaderStyle} />}
          ListFooterComponent={/* on far right of ActivityList */
            <TouchableHighlight
              style={trackingActivity ?
                listFooterTrackingStyle
                :
                (timelineNow ? listFooterNowNotTrackingStyle : listFooterBaseStyle) }
              onPress={() => { this.props.onPressFutureZone() /* which will enable timelineNow mode */ }}
              underlayColor={colors.futureZoneUnderlay}
            >
              <View style={listFooterClockStyle}>
                <NowClockContainer clockStyle={{ bottom: clockBottom }} interactive={false} />
                <View style={Styles.labelView}>
                  <LabelContainer>
                    <Text style={labelTextStyle}>
                      NOW
                    </Text>
                  </LabelContainer>
                </View>
              </View>
            </TouchableHighlight>
          }
          onLayout={this.autoScroll}
          onScroll={this.handleScroll}
          onScrollBeginDrag={this.handleScrollBeginDrag}
          onScrollEndDrag={this.handleScrollEndDrag}
          onMomentumScrollEnd={this.handleScrollEndDrag /* experiment */}
          ref={(ref) => {
            if (ref) {
              _ref = ref;
              this.props.register && this.props.register(this);
            }
          }}
          renderItem={this.renderItem}
          scrollIndicatorInsets={scrollInsets}
          showsHorizontalScrollIndicator={true}
          style={{ marginTop: topBottomBorderHeight }}
        />
      </View>
    )
  }

  // item in this case is the cached ActivityDataExtended and index is just an index into the same list.
  // Note the rounding is so we don't update this component more often than once per second, worst case, to show time.
  renderItem({ item, index, separators }) {
    const activity = item as ActivityDataExtended;
    return (
      <View style={{ borderRadius: constants.activityList.borderRadius, overflow: 'hidden' }}>
        <ActivityListItem
          activity={activity}
          selected={activity.id === this.props.selectedActivityId}
          onPress={() => { this.props.onPressActivity(activity.id) }}
        />
      </View>
    )
  }

  // Scroll the ActivityList as appropriate such that the actvity for the given scrollTime aligns with the centerline.
  // If scrollTime is within an activity, center the activity under the TopButton, adjusting it so the centerline
  // delineates the elapsed and future portions of the activity, proportionally (with each activity having equal width.)
  // If scrollTime is before / between / after an activity, the list is scrolled to the space adjacent to the
  // closest activity.
  scrollToTime(scrollTime: number) {
    log.scrollEvent('ActivityList scrollToTime', scrollTime);
    const {
      list,
      trackingActivity,
    } = this.props;
    let offset = activityMargin; // starting point
    if (list && list.length) {
      const index = list.findIndex((activity: ActivityDataExtended) => { // look for the activity we are scrolling to
        const start = activity.tStart;
        if (!activity.tEnd && !activity.tLast) {
          return false;
        }
        // Note we use now time here to optimize scrolling the currentActivity, which lacks tEnd.
        const end = activity.tEnd ? activity.tEnd : Math.max(activity.tLast || 0, utils.now());
        if (start <= scrollTime && scrollTime <= end) {
          return true;
        }
        return false;
      }); // findIndex
      if (index >= 0) { // found matching activity
        if (_ref) {
          const activity = list[index];
          const end = activity.tEnd || activity.tLastUpdate!;
          const activityElapsedTime = scrollTime - activity.tStart;
          // first, offset for the index
          offset += index * (activityMargin + activityWidth);
          // now offset for the elapsed portion within the activity
          const now = utils.now();
          const tTotal = (end && activity.tTotal) ? activity.tTotal : (now - activity.tStart);
          const increment = (activityElapsedTime / tTotal) * activityWidth;
          offset += increment;
        }
      } else { // no match for activity
        if (scrollTime > list[list.length - 1].tLast) {
          // after the last activity
          offset = list.length * (activityMargin + activityWidth) +
            (trackingActivity ? 0 : activityMargin / 2);
          log.scrollEvent('activityList.scrollToTime: after the last activity');
        } else {
          for (let index = 0; index < list.length; index++) {
            const activity = list[index];
            if (scrollTime < activity.tStart) {
              // before some activity
              if (index) {
                // between two activities
                offset = index * (activityMargin + activityWidth) + activityMargin / 2;
              } else {
                // before the first activity
                offset -= activityMargin / 2;
              }
              break;
            }
          }
        }
      }
    } else { // empty list
      log.trace('ActivityList: scrollToTime: empty list');
    }
    const params = {
      animated: false,
      offset,
    }
    log.scrollEvent('ActivityList scrollToTime scrollToOffset', params);
    if (!_ref.scrollToOffset) {
      log.warn('missing scrollToOffset!');
    }
    _ref.scrollToOffset(params);
  }
}

export default ActivityList;
