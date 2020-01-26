import * as React from 'react';

import {
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import constants from 'lib/constants';
import {
  metersToMilesText,
  msecToString,
} from 'shared/units';

import { ActivityDataExtended } from 'shared/activities';

interface ActivityListItemProps {
  activity: ActivityDataExtended;
  onPress: () => void;
  selected: boolean;
}

const colors = constants.colors.activityList;
const {
  activityHeight,
  activityMargin,
  activityWidth,
  borderRadius,
  borderWidth,
  height,
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
    marginLeft: activityMargin, // Note activityMargin is applied only on the left. Important for offset calculations.
  },
})

const ActivityListItem = (props: ActivityListItemProps) => {
  const { activity, selected } = props;
  const isCurrent = !activity.tEnd;
  const { tLast } = activity;
  const time = (tLast && activity.tStart) ?
    msecToString(Math.max(0, tLast - activity.tStart)) : '';
  const distance = (activity.odo && activity.odoStart) ?
    metersToMilesText(activity.odo - activity.odoStart) : '';
  const activityStyle = [
    Styles.activity,
    isCurrent ? Styles.currentActivity : (selected ? Styles.pastActivitySelected : Styles.pastActivity),
  ]
  const textStyle = [Styles.text, selected ? Styles.textSelected : null];
  // Note onPress receives a GestureResponderEvent we are ignoring.
  return (
    <TouchableHighlight
      onPress={props.onPress}
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

export default React.memo(ActivityListItem);
