import * as React from 'react';

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ActivityDetailsProps } from 'containers/ActivityDetailsContainer';
import constants from 'lib/constants';
import utils from 'lib/utils';

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
    opacity: 0.5,
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

const ActivityDetails = (props: ActivityDetailsProps) => (props.visible ? (
  <View pointerEvents="none" style={[Styles.box, { top: props.top }]}>
    <View style={Styles.row}>
      <View style={[Styles.item, itemBackgroundStyle(props), Styles.itemLeft]}>
        <View style={Styles.itemContents}>
          <Text style={Styles.bigText}>
            {props.timeText}
          </Text>
          <Text style={Styles.labelText}>
            ELAPSED TIME HH:MM:SS
          </Text>
        </View>
       </View>
      <View style={Styles.bufferZone}>
      </View>
      <View style={[Styles.item, itemBackgroundStyle(props), Styles.itemRight]}>
        <View style={Styles.itemContents}>
          <Text style={Styles.bigText}>
            {props.distanceText}
          </Text>
          <Text style={Styles.labelText}>
            DISTANCE (mi)
          </Text>
        </View>
      </View>
    </View>
    <View style={Styles.row}>
      <View style={[Styles.item, itemBackgroundStyle(props), Styles.itemLeft]}>
        <View style={Styles.itemContents}>
          <Text style={Styles.bigText}>
            {props.paceText}
          </Text>
          <Text style={Styles.labelText}>
            PACE (min/mi)
          </Text>
        </View>
      </View>
      <View style={Styles.bufferZone}>
      </View>
      <View style={[Styles.item, itemBackgroundStyle(props), Styles.itemRight]}>
        <View style={Styles.itemContents}>
          <Text style={Styles.bigText}>
            {props.elevationText}
          </Text>
          <Text style={Styles.labelText}>
            ELEVATION (feet)
          </Text>
        </View>
      </View>
    </View>
    <View style={Styles.row}>
      <View style={[Styles.item, itemBackgroundStyle(props), Styles.itemLeft]}>
        <View style={Styles.itemContents}>
          <Text style={Styles.bigText}>
            {props.averagePaceText}
          </Text>
          <Text style={Styles.labelText}>
            AVERAGE PACE (min/mi)
          </Text>
        </View>
      </View>
      <View style={Styles.bufferZone}>
      </View>
      <View style={[Styles.item, itemBackgroundStyle(props), Styles.itemRight]}>
        <View style={Styles.itemContents}>
          <Text style={Styles.bigText}>
            {props.averageSpeedText}
          </Text>
          <Text style={Styles.labelText}>
            AVERAGE SPEED (mph)
          </Text>
        </View>
      </View>
    </View>
  </View>
) : null)

export default React.memo(ActivityDetails);
