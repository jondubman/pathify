import React, {
  Component,
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
import { ActivityData } from 'shared/activities';
import log from 'shared/log';
import {
  metersToMilesText,
  msecToString,
} from 'shared/units';

const colors = constants.colors.activityList;
const {
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
    height: height,
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
  outer: {
    marginHorizontal,
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
})

const marginLeft = centerline() - (0.5 * (activityWidth + marginHorizontal * 2));
const marginRight = marginLeft + marginHorizontal;

const getItemLayout = (data: ActivityData[] | null, index: number) => (
  {
    index,
    length: ((marginHorizontal * 2) + activityWidth),
    offset: marginLeft + (index * (marginHorizontal + activityWidth + marginHorizontal))
  }
)

class ActivityList extends Component<ActivityListProps> {

  constructor(props: ActivityListProps) {
    super(props);
    this.handleScroll = this.handleScroll.bind(this);
    this.renderItem = this.renderItem.bind(this);
  }

  handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    log.debug('handleScroll', event.nativeEvent.contentOffset.x);
  }

  render() {
    return (
      <View style={[Styles.box, { top: this.props.top }]}>
        <FlatList<ActivityData>
          data={this.props.list}
          extraData={this.props}
          getItemLayout={getItemLayout}
          horizontal
          onScroll={this.handleScroll}
          ref={(ref) => {
            if (ref) {
              this.props.registerRef(ref);
            }
          }}
          renderItem={this.renderItem}
        />
      </View>
    )
  }

  renderItem({ item, index, separators }) {
    const activity = item as ActivityData;
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
          Styles.outer,
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
