import React, {
  Fragment,
} from 'react';

import {
  StyleSheet,
  TouchableHighlight,
  View,
  Text,
} from 'react-native';

import { RefTimeProps } from 'containers/RefTimeContainer';
import constants from 'lib/constants';

const colors = constants.colors.refTime;
const {
  height,
  leftContentsWidth,
  topSpace,
  width,
} = constants.refTime;

const Styles = StyleSheet.create({
  leftHalf: {
    flexDirection: 'row-reverse',
    width,
  },
  leftHighlight: {
    height,
    justifyContent: 'flex-start', // vertically
    paddingTop: topSpace,
    width: leftContentsWidth,
  },
  leftText: {
    alignSelf: 'flex-end',
    marginRight: 5,
  },
  leftView: {
  },
  refTimeContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    position: 'absolute',
  },
  refTimeFull: {
    flexDirection: 'row',
    marginTop: topSpace - 2,
  },
  refTimeText: {
    fontFamily: constants.fonts.family,
    fontSize: 16,
  },
  rightHalf: {
    height,
    paddingLeft: 5,
    width,
  },
  subText: {
    color: colors.subText,
    fontFamily: constants.fonts.family,
    fontSize: 11,
  },
  hoursMinutes: {
    color: colors.hoursMinutes,
  },
  seconds: {
    color: colors.seconds,
  },
  msec: {
    color: colors.msec,
  },
})

const RefTime = (props: RefTimeProps) => (
  <View pointerEvents="none" style={[Styles.refTimeContainer, { bottom: props.bottom }]}>
    <View style={Styles.leftHalf}>
      {props.showLeftSide ? (
        <TouchableHighlight
          onPress={props.onPress}
          style={Styles.leftHighlight}
          underlayColor={colors.underlay}
        >
          <View style={Styles.leftView}>
            <Text style={[Styles.subText, Styles.leftText, props.flavorLine2 ? {} : { marginTop: 2 }]}>
              {props.flavorLine1}
            </Text>
            <Text style={[Styles.subText, Styles.leftText]}>
              {props.flavorLine2}
            </Text>
            <Text style={[Styles.subText, Styles.leftText]}>
              {props.flavorLine3}
            </Text>
          </View>
        </TouchableHighlight>
      ) : null }
    </View>
    <TouchableHighlight
      onPress={props.onPress}
      style={Styles.rightHalf}
      underlayColor={colors.underlay}
    >
      <Fragment>
        <View style={Styles.refTimeFull}>
          <Text style={[Styles.refTimeText, Styles.hoursMinutes]}>
            {props.hours}:{props.minutes}
          </Text>
          <Text style={[Styles.refTimeText, Styles.seconds]}>
            :{props.seconds}
          </Text>
          {/* Fractions not needed in a context in which most of the interesting things happen no more than 1x/sec...
          <Text style={[Styles.refTimeText, Styles.msec]}>
            .{props.hundredths}
          </Text>
          */}
        </View>
        <Text style={Styles.subText}>
          {props.ampm} {props.day} {props.month} {props.dayOfMonth}, {props.year}
        </Text>
      </Fragment>
    </TouchableHighlight>
  </View>
)

export default RefTime;
