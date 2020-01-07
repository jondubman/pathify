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
import {
  metersToMilesText,
  msecToString,
} from 'shared/units';

const colors = constants.colors.activityList;
const {
  activityHeight,
  activityWidth,
  borderRadius,
  borderWidth,
  height,
  marginHorizontal,
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
    marginHorizontal,
    height: activityHeight,
  },
})

// marginLeft allows scrolling so left margin of leftmost activity is centered
const marginLeft = centerline();

// marginRight allows scrolling to right margin of rightmost activity is centered
const marginRight = marginLeft + marginHorizontal + (0.5 * activityWidth);

const getItemLayout = (data: ActivityDataExtended[] | null, index: number) => (
  {
    index,
    length: ((marginHorizontal * 2) + activityWidth),
    offset: marginLeft + (index * (marginHorizontal + activityWidth + marginHorizontal)),
  }
)

let _ref: FlatList<ActivityDataExtended>;
let _lastAutoScrollTime: number = 0;

class ActivityList extends Component<ActivityListProps> {

  constructor(props: ActivityListProps) {
    super(props);
    this.autoScrollAfterForcedUpdate = this.autoScrollAfterForcedUpdate.bind(this);
    this.autoScroll = this.autoScroll.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.renderItem = this.renderItem.bind(this);
    this.scrollToTime = this.scrollToTime.bind(this);
  }

  autoScroll() {
    const state = store.getState(); // TODO not great form to grab state straight from here, but it's expedient.
    const scrollTime = state.options.scrollTime; // This may change rapidly and we just want the latest we can get.
    if (scrollTime) {
      log.trace('ActivityList autoScroll', 'refreshCount', this.props.refreshCount,
        'length', this.props.list.length);
      this.scrollToTime(scrollTime);
    }
  }

  autoScrollAfterForcedUpdate() {
    this.forceUpdate(() => {
      this.autoScroll();
    })
  }

  componentDidUpdate(prevProps: ActivityListProps) {
    if (prevProps.list.length !== this.props.list.length ||
        prevProps.selectedActivityId != this.props.selectedActivityId) {
      this.autoScroll();
    }
  }

  // Handle a scroll event
  handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const offset = event.nativeEvent.contentOffset.x;
    const timeGap = utils.now() - _lastAutoScrollTime;
    if (timeGap > constants.timing.activityListAnimationCompletion) {
      log.trace('handleScroll (ActivityList --> Timeline)', offset, _lastAutoScrollTime, timeGap);
      // TODO
    } else {
      log.trace('handleScroll (ignoring)', offset, this.props.timelineScrolling, _lastAutoScrollTime, timeGap);
    }
  }

  render() {
    utils.addToCount('renderActivityList');
    const scrollInsets = { top: 0, bottom: 0, left: 0, right: 0 };
    return (
      <Fragment>
        <View style={[Styles.box, { top: this.props.top }]}>
          <FlatList<ActivityDataExtended>
            data={this.props.list}
            extraData={this.props}
            getItemLayout={getItemLayout}
            horizontal
            initialScrollIndex={Math.min(0, this.props.list.length - 1) /* TODO no effect? */}
            onLayout={this.autoScroll}
            onScroll={this.handleScroll}
            ref={(ref) => {
              if (ref) {
                _ref = ref;
                this.props.register && this.props.register(this);
              }
            }}
            renderItem={this.renderItem}
            scrollIndicatorInsets={scrollInsets}
        />
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
        style={[
          Styles.touchableActivity,
          isCurrent || index === this.props.list.length - 1 ? { marginRight } : {},
          (index === 0) ?
            { marginLeft: marginLeft + marginHorizontal } :
            { marginLeft: marginHorizontal },
        ]}
        underlayColor={isCurrent ? colors.current.underlay : colors.past.underlay}
      >
        <View style={activityStyle}>
          <Text style={textStyle}>{time}</Text>
          <Text style={textStyle}>{distance}</Text>
        </View>
      </TouchableHighlight>
    )
  }

  scrollToTime(scrollTime: number) {
    log.trace('ActivityList scrollToTime', scrollTime);
    const { list, selectedActivityId } = this.props;
    const index = list.findIndex((activity: ActivityDataExtended) => activity.id === selectedActivityId);
    if (index >= 0) {
      if (_ref) {
        const activity = list[index];
        let viewOffset = 0;
        if (activity.tStart) {
          if (activity.tEnd && activity.tTotal) {
            const tMiddle = activity.tStart + (activity.tEnd - activity.tStart) / 2;
            viewOffset = ((tMiddle - scrollTime) / (activity.tTotal / 2)) * (activityWidth / 2);
            log.trace('tStart', activity.tStart, 'tMiddle', tMiddle, 'tEnd', activity.tEnd, 'tTotal', activity.tTotal,
              'scrollTime', scrollTime, '%', (100 * (scrollTime - activity.tStart) / activity.tTotal).toFixed(0),
              'viewOffset', viewOffset);
          } else {
            // currentActivity
            viewOffset = -activityWidth / 2;
          }
          const params = {
            animated: this.props.animated,
            index,
            viewOffset,
            viewPosition: 0.5, // 0.5 tells scrollToIndex to scroll the center point (use 0 for left, 1 for right)
          }
          log.trace('scrollToTime scrollToIndex', params);
          _lastAutoScrollTime = utils.now();
          _ref.scrollToIndex(params);
        }
      }
    } else {
      log.trace('scrollToTime index', index, 'length', list.length, 'selectedActivityId', selectedActivityId);
    }
  }
}

export default ActivityList;
