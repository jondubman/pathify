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
  scrollbarHeight,
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

class ActivityList extends Component<ActivityListProps> {

  constructor(props: ActivityListProps) {
    super(props);
    this.autoScroll = this.autoScroll.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.renderItem = this.renderItem.bind(this);
  }

  // Automatically scroll the ActivityList as scrollTime changes.
  autoScroll() {
    const { list, selectedActivityId } = this.props;
    const index = list.findIndex((activity: ActivityDataExtended) => activity.id === selectedActivityId);
    if (index >= 0) {
      if (_ref) {
        const activity = list[index];
        let viewOffset = activityWidth / 2; // TODO if current do we want to use -activityWidth / 2?
        if (activity.tStart && activity.tTotal) {
          viewOffset -= ((this.props.scrollTime - activity.tStart) / activity.tTotal) * activityWidth;
          log.trace('viewOffset', viewOffset);
        }
        const params = {
          animated: true,
          index,
          viewOffset,
          viewPosition: 0.5, // 0.5 tells scrollToIndex to scroll the center point (use 0 for left, 1 for right)
        }
        log.trace('autoScroll scrollToIndex', params);
        _ref.scrollToIndex(params);
      }
    } else {
      log.trace('autoScroll index', index, list.length, selectedActivityId);
    }
  }

  componentDidUpdate() {
    this.autoScroll();
  }

  // Handle a scroll event
  handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const offset = event.nativeEvent.contentOffset.x;
    log.trace('handleScroll', offset);
  }

  render() {
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
            onScroll={this.handleScroll}
            ref={(ref) => {
              if (ref) {
                _ref = ref;
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
    const textStyle = [Styles.text, isSelected ? Styles.textSelected : null ];
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
}

export default ActivityList;
