import * as React from 'react';

import {
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import { ActivityDataExtended } from 'lib/activities';
import constants from 'lib/constants';
import {
  metersToMilesText,
  msecToTimeString,
} from 'lib/units';

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
    justifyContent: 'space-around',
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
  faint: {
    opacity: 0.65,
  },
  text: {
    color: colors.text,
    fontSize: 16,
    fontFamily: constants.fonts.family,
  },
  textEmphasize: {
    fontWeight: 'bold',
  },
  textLine: {
    alignSelf: 'center',
    flexDirection: 'row',
  },
  textLines: {
    flexDirection: 'column',
  },
  textSelected: {
    color: colors.textSelected,
  },
  timeLabel: {
    fontSize: 11,
  },
  touchableActivity: {
    borderRadius,
    height: activityHeight,
    marginLeft: activityMargin, // Note activityMargin is applied only on the left. Important for offset calculations.
  },
})

const ActivityListItem = (props: ActivityListItemProps) => {
  const { activity, selected } = props;
  const isCurrent = !activity.tEnd;
  const { tLast } = activity;
  const time = (tLast && activity.tStart) ?
    msecToTimeString(Math.max(0, tLast - activity.tStart)) : '';
  const distance = (activity.odo && activity.odoStart) ?
    metersToMilesText(activity.odo - activity.odoStart, '') : '';
  const distanceLabel = ' mi';
  const activityStyle = [
    Styles.activity,
    isCurrent ? Styles.currentActivity : (selected ? Styles.pastActivitySelected : Styles.pastActivity),
  ]
  const textStyle = [Styles.text, selected ? Styles.textSelected : null];
  const infoStyle = [textStyle, Styles.textEmphasize];
  // Note onPress receives a GestureResponderEvent we are ignoring.
  return (
    <TouchableHighlight
      onPress={props.onPress}
      style={Styles.touchableActivity}
      underlayColor={isCurrent ? colors.current.underlay : colors.past.underlay}
    >
      <View style={activityStyle}>
        <View style={Styles.textLines}>
          <View style={Styles.textLine}>
            <Text style={infoStyle}>{time}</Text>
          </View>
        </View>
        <View style={Styles.textLines}>
          <View style={Styles.textLine}>
            <Text style={[Styles.faint, Styles.text, Styles.timeLabel]}>TOTAL</Text>
          </View>
        </View>
        <View style={Styles.textLine}>
          <Text style={infoStyle}>{distance}</Text>
          <Text style={textStyle}>{distanceLabel}</Text>
        </View>
      </View>
    </TouchableHighlight>
  )
}

export default React.memo(ActivityListItem);
