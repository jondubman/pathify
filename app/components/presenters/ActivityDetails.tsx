import * as React from 'react';

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ActivityDetailsProps } from 'containers/ActivityDetailsContainer';
import constants from 'lib/constants';

const {
  bigFontSize,
  borderRadius,
  borderWidth,
  height,
  itemMarginBottom,
  itemMarginEdges,
  itemMarginTop,
  labelFontSize,
  spaceBetween,
} = constants.activityDetails;
const colors = constants.colors.activityDetails;

const Styles = StyleSheet.create({
  bigText: {
    alignSelf: 'center',
    color: colors.bigFont,
    fontFamily: constants.fonts.family,
    fontSize: bigFontSize,
  },
  labelText: {
    alignSelf: 'center',
    color: colors.labelFont,
    fontFamily: constants.fonts.family,
    fontSize: labelFontSize,
    marginBottom: constants.buttonOffset,
    opacity: 0.75,
  },
  box: {
    backgroundColor: 'transparent',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  bufferZone: {
    backgroundColor: 'transparent',
    width: spaceBetween,
  },
  row: {
    flexDirection: 'row',
  },
  item: {
    borderColor: colors.border,
    borderRadius,
    borderWidth,
    flex: 0.5,
    flexDirection: 'row',
    marginBottom: itemMarginBottom,
    marginTop: itemMarginTop,
  },
  itemContents: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    height,
  },
  itemLeft: {
    marginLeft: itemMarginEdges,
  },
  itemRight: {
    marginRight: itemMarginEdges,
  },
  itemCurrentNow: {
    backgroundColor: colors.backgroundCurrentNow,
  },
  itemCurrentSelected: {
    backgroundColor: colors.backgroundCurrentSelected,
  },
  itemPast: {
    backgroundColor: colors.backgroundPast,
  },
})

const itemBackgroundStyle = (props: ActivityDetailsProps) => (
  props.isCurrent ? (props.timelineNow ? Styles.itemCurrentNow : Styles.itemCurrentSelected) : Styles.itemPast
)

const ActivityDetailsRow = ({ props, rowIndex, text1, caption1, text2, caption2 }) => (
  (props.rows < rowIndex) ? null : (
    <View style={Styles.row}>
      <View style={[Styles.item, itemBackgroundStyle(props), Styles.itemLeft]}>
        <View style={Styles.itemContents}>
          <Text style={Styles.bigText}>
            {text1}
          </Text>
          <Text style={Styles.labelText}>
            {caption1}
          </Text>
        </View>
      </View>
      <View style={Styles.bufferZone}>
      </View>
      <View style={[Styles.item, itemBackgroundStyle(props), Styles.itemRight]}>
        <View style={Styles.itemContents}>
          <Text style={Styles.bigText}>
            {text2}
          </Text>
          <Text style={Styles.labelText}>
            {caption2}
          </Text>
        </View>
      </View>
    </View>
  )
)

const ActivityDetails = (props: ActivityDetailsProps) => (props.visible ? (
  <View pointerEvents="none" style={[Styles.box, { top: props.top }]}>
    <ActivityDetailsRow
      props={props} rowIndex={1}
      text1={props.timeText}
        caption1={props.timelineNow ? 'ELAPSED TIME HH:MM:SS' : ' HH:MM:SS FROM START'}
      text2={props.distanceText}
        caption2={props.timelineNow ? 'TOTAL DISTANCE (mi)' : 'DISTANCE @ TIMEPOINT (mi)'}
    />
    <ActivityDetailsRow
      props={props} rowIndex={2}
      text1={props.averagePaceText}
        caption1="AVERAGE PACE (min/mi)"
      text2={props.averageSpeedText}
        caption2="AVERAGE SPEED (mph)"
    />
    <ActivityDetailsRow
      props={props} rowIndex={3}
      text1={props.speedPaceText}
        caption1={props.timelineNow ? 'CURRENT PACE (min/mi)' : 'PACE @ TIMEPOINT (min/mi)'}
      text2={props.speedText}
        caption2={props.timelineNow ? 'CURRENT SPEED (mph)' : 'SPEED @ TIMEPOINT (mph)'}
    />
    <ActivityDetailsRow
      props={props} rowIndex={4}
      text1={props.modeText}
        caption1="MODE"
      text2={props.elevationText}
        caption2="ELEVATION (feet)"
    />
    <ActivityDetailsRow
      props={props} rowIndex={5}
      text1={props.modeDurationText}
        caption1={props.modeDurationLabel}
      text2={props.index === props.length ? props.length.toString() : `${props.index}/${props.length}`}
        caption2="# OF TIMEPOINTS"
    />
  </View>
) : null)

export default React.memo(ActivityDetails);
