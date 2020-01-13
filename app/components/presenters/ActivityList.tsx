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
import constants from 'lib/constants';
import { centerline } from 'lib/selectors';
import store from 'lib/store';
import utils from 'lib/utils';
import { ActivityDataExtended } from 'shared/activities';
import log from 'shared/log';
import { Timepoint } from 'shared/timeseries';
import {
  metersToMilesText,
  msecToString,
} from 'shared/units';

const colors = constants.colors.activityList;
const {
  activityHeight,
  activityMargin,
  activityWidth,
  borderRadius,
  borderWidth,
  centerLineShortWidth,
  centerLineTop,
  centerLineWidth,
  height,
  topBottomBorderHeight
} = constants.activityList;

const Styles = StyleSheet.create({
  activity: {
    borderRadius,
    borderWidth,
    height: activityHeight,
    width: activityWidth,
  },
  currentActivity: {
    backgroundColor: colors.current.background,
    borderColor: colors.current.border,
  },
  pastActivity: {
    backgroundColor: colors.past.background,
    borderColor: colors.past.border,
  },
  pastActivitySelected: {
    backgroundColor: colors.past.selected,
    borderColor: colors.past.borderSelected,
  },
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
  textSelected: {
    color: colors.textSelected,
  },
  touchableActivity: {
    height: activityHeight,
    marginLeft: activityMargin,
  },
  borderLine: {
    backgroundColor: colors.borderLine,
    position: 'absolute',
    width: utils.windowSize().width,
    height: constants.activityList.borderLineHeight,
  },
  centerLine: {
    backgroundColor: colors.centerLine,
  },
  centerLineBright: {
    backgroundColor: colors.centerLineBright,
  },
  centerLineSelected:{
    backgroundColor: colors.centerLineSelected,
  }
})

const marginLeft = centerline(); // allows list to be positioned such that left edge of real content is centered.
const marginRight = centerline(); // allows list to be positioned such that right edge of real content is centered.

// The basic layout of this horizontal list is simple: margins flanking N boxes, each with activityMargin.
// marginLeft (activityMargin activityWidth)* marginRight
const getItemLayout = (data: ActivityDataExtended[] | null, index: number) => (
  {
    index,
    length: (activityMargin + activityWidth),
    offset: marginLeft + (index * (activityMargin + activityWidth)),
  }
)

let _ref: FlatList<ActivityDataExtended>;

class ActivityList extends Component<ActivityListProps> {

  constructor(props: ActivityListProps) {
    super(props);
    this.autoScroll = this.autoScroll.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.renderItem = this.renderItem.bind(this);
    this.scrollToTime = this.scrollToTime.bind(this);
  }

  autoScroll() {
    const state = store.getState(); // TODO not great form to grab state straight from here but
    const scrollTime = state.options.scrollTime; // this may change rapidly and we just want the latest we can get.
    if (scrollTime) {
      log.trace('ActivityList autoScroll', 'refreshCount', this.props.refreshCount,
        'length', this.props.list.length);
      this.scrollToTime(scrollTime);
    }
  }

  // Handle a scroll event
  handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { x } = event.nativeEvent.contentOffset;
    log.trace('ActivityList handleScroll', x);
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
    if (activity && activity.tTotal && proportion <= 1) {
      const timeWithinActivity = proportion * activity.tTotal;
      const t: Timepoint = activity.tStart + timeWithinActivity;
      log.trace('handleScroll', baseX, ratio, index, proportion, timeWithinActivity, t);
      this.props.onScrollTimeline(t);
    }
    if (index >= list.length || (index === list.length - 1 && proportion > 1)) { // after the last activity
      this.props.reachedEnd();
    }
  }

  render() {
    utils.addToCount('renderActivityList');
    const scrollInsets = { top: 0, bottom: 0, left: 0, right: 0 };
    const backgroundColor = constants.colors.activityList.backgroundMargin;
    // the left margin of the first activity is effectively the right margin of listHeaderStyle
    const listHeaderStyle = { backgroundColor, width: marginLeft, height: activityHeight };
    const listFooterStyle = { ...listHeaderStyle, marginLeft: activityMargin, width: marginRight };
    const { betweenActivities, list, top } = this.props;

    // make centerLineBase style
    const centerLineLeft = centerline() - centerLineWidth / 2;
    const centerLineRight = centerline() - centerLineWidth / 2;
    const centerLineShortLeft = centerline() - centerLineShortWidth / 2;
    const centerLineShortRight = centerline() - centerLineShortWidth / 2;
    const centerLineBase = {
      left: centerLineLeft,
      right: centerLineRight,
      height,
      position: 'absolute',
      top: centerLineTop,
    } as any;
    const shortHeight = -centerLineTop + topBottomBorderHeight;

    return (
      <Fragment>
        <View style={[Styles.box, { top }]}>
          <FlatList<ActivityDataExtended>
            data={list}
            extraData={this.props}
            getItemLayout={getItemLayout}
            horizontal
            initialScrollIndex={Math.max(0, list.length - 1)}
            ListHeaderComponent={<View style={listHeaderStyle} />}
            ListFooterComponent={<View style={listFooterStyle} />}
            onLayout={this.autoScroll}
            onScroll={this.handleScroll}
            style={{ marginTop: topBottomBorderHeight }}
            ref={(ref) => {
              if (ref) {
                _ref = ref;
                this.props.register && this.props.register(this);
              }
            }}
            renderItem={this.renderItem}
            scrollIndicatorInsets={scrollInsets}
          />
          <View pointerEvents="none" style={[Styles.borderLine, { top: 0 }]} />
          <View pointerEvents="none" style={[Styles.borderLine, { top: 2 }]} />
          <View pointerEvents="none" style={[Styles.borderLine, { top: topBottomBorderHeight + activityHeight + 2 }]} />
          <View pointerEvents="none" style={[Styles.borderLine, { top: topBottomBorderHeight + activityHeight + 4 }]} />
          {betweenActivities ?
            <View pointerEvents="none" style={[centerLineBase, Styles.centerLineBright]} />
            :
            <Fragment>
              <View pointerEvents="none" style={[
                centerLineBase,
                Styles.centerLineSelected,
                {
                  height: shortHeight,
                  width: centerLineShortWidth,
                  left: centerLineShortLeft,
                  right: centerLineShortRight,
                },
              ]} />
              <View pointerEvents="none" style={[centerLineBase, Styles.centerLine]} />
            </Fragment>
          }
        </View>
      </Fragment>
    )
  }

  renderItem({ item, index, separators }) {
    const activity = item as ActivityDataExtended;
    const isCurrent = !activity.tEnd;
    const time = (activity.tLastUpdate && activity.tStart) ?
      msecToString(activity.tLastUpdate - activity.tStart) : '';
    const distance = (activity.odo && activity.odoStart) ?
      metersToMilesText(activity.odo - activity.odoStart) : '';
    const isSelected = (activity.id === this.props.selectedActivityId);
    const activityStyle = [
      Styles.activity,
      isCurrent ? Styles.currentActivity : (isSelected ? Styles.pastActivitySelected : Styles.pastActivity),
    ]
    const textStyle = [Styles.text, isSelected ? Styles.textSelected : null];
    // Note onPress receives a GestureResponderEvent we are ignoring.
    return (
      <TouchableHighlight
        onPress={() => { this.props.onPressActivity(item) }}
        style={Styles.touchableActivity}
        underlayColor={isCurrent ? colors.current.underlay : colors.past.underlay}
      >
        <View style={activityStyle}>
          <Text style={textStyle}>{time}</Text>
          <Text style={textStyle}>{distance}</Text>
        </View>
      </TouchableHighlight>
    )
  }

  // Scroll the ActivityList as appropriate such that the actvity for the given scrollTime aligns with the centerline.
  // If scrollTime is within an activity, center the activity under the TopButton, adjusting it so the centerline
  // delineates the elapsed and future portions of the activity, proportionally (with each activity having equal width.)
  // If scrollTime is before / between / after an activity, the list is scrolled to the space adjacent to the
  // closest activity.
  scrollToTime(scrollTime: number) {
    log.trace('ActivityList scrollToTime', scrollTime);
    const { animated, list } = this.props;
    let offset = activityMargin;
    if (list && list.length) {
      const index = list.findIndex((activity: ActivityDataExtended) => {
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
          offset = list.length * (activityMargin + activityWidth) + activityMargin / 2;
          log.trace('activityList.scrollToTime: after the last activity');
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
      log.trace('empty list');
    }
    const params = {
      animated,
      offset,
    }
    log.trace('ActivityList scrollToTime scrollToOffset', params);
    if (!_ref.scrollToOffset) {
      log.warn('missing scrollToOffset!');
    }
    _ref.scrollToOffset(params);
  }
}

export default ActivityList;
