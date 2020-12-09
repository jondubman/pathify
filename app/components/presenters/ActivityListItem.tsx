import * as React from 'react';

import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  ViewStyle,
} from 'react-native';

import { ActivityDataExtended } from 'lib/activities';
import constants, { withOpacity } from 'lib/constants';
import {
  metersToMilesText,
  msecToTimeString,
} from 'lib/units';

interface ActivityListItemProps {
  activity: ActivityDataExtended;
  activityColor: string;
  colorizeActivities: boolean;
  labelsEnabled: boolean;
  onPress: () => void;
  isCurrent: boolean;
  isSelected: boolean;
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
  labelsEnabled: {
    color: constants.colors.infoLabels.default,
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
  const {
    activity,
    activityColor,
    colorizeActivities,
    isCurrent,
    isSelected,
    labelsEnabled,
  } = props;
  // const isCurrent = !activity.tEnd; // old way
  const { tLast } = activity;
  const time = (tLast && activity.tStart) ?
    msecToTimeString(Math.max(0, tLast - activity.tStart)) : '';
  const distance = (activity.odo && activity.odoStart) ?
    metersToMilesText(activity.odo - activity.odoStart, '') : '';
  const distanceLabel = ' mi';
  const pastActivityNotSelectedStyle = {
    ...Styles.pastActivity,
    backgroundColor: activityColor,
  }
  const activityStyle: StyleProp<ViewStyle> = [
    Styles.activity,
    isCurrent ? Styles.currentActivity : (isSelected ? Styles.pastActivitySelected : pastActivityNotSelectedStyle),
  ]
  if (isSelected && !isCurrent && colorizeActivities) {
    activityStyle.push({
      borderColor: withOpacity(activityColor, 0.65), // boost opacity to this
      borderWidth: constants.activityList.itemBorderWidthSelected,
      backgroundColor: withOpacity(activityColor, 0.45), // boost opacity to this
    });
  }
  const textStyle = [Styles.text, isSelected ? Styles.textSelected : null];
  const infoStyle = [textStyle, Styles.textEmphasize];
  const activityDesciptor = isSelected ? (isCurrent ? 'CURRENT' : 'SELECTED')
                                       : (isCurrent ? 'CURRENT' : 'TIMED');

  const descriptorStyle = labelsEnabled ? [Styles.text, Styles.timeLabel, Styles.labelsEnabled, Styles.textEmphasize]
                                        : [Styles.faint, Styles.text, Styles.timeLabel];

  const underlayColor = isCurrent ? colors.current.underlay : (
    colorizeActivities ? constants.colors.byName.black : colors.past.underlay
  )
  // Note onPress receives a GestureResponderEvent we are ignoring.
  return (
    <TouchableHighlight
      onPress={props.onPress}
      style={Styles.touchableActivity}
      underlayColor={underlayColor}
    >
      <View style={activityStyle}>
        <View style={Styles.textLines}>
          <View style={Styles.textLine}>
            <Text style={infoStyle}>{time}</Text>
          </View>
        </View>
        <View style={Styles.textLines}>
          <View style={Styles.textLine}>
            <Text style={descriptorStyle}>{activityDesciptor}</Text>
          </View>
        </View>
        <View style={Styles.textLines}>
          <View style={Styles.textLine}>
            <Text style={descriptorStyle}>ACTIVITY</Text>
          </View>
        </View>
        <View style={Styles.textLine}>
          <Text style={infoStyle}>{distance}</Text>
          <Text style={textStyle}>{distance.length ? distanceLabel : ''}</Text>
        </View>
      </View>
    </TouchableHighlight>
  )
}

export default React.memo(ActivityListItem);
