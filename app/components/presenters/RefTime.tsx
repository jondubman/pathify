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
const { height, leftContentsWidth, width } = constants.refTime;

const Styles = StyleSheet.create({
  leftHalf: {
    backgroundColor: 'transparent', // nothing left of the centerline, for now
    flexDirection: 'row-reverse',
    width,
  },
  leftContents: {
    height,
    justifyContent: 'flex-end',
    width: leftContentsWidth,
  },
  refTimeContainer: {
    alignSelf: 'center',
    height,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    width: width * 2,
  },
  refTimeFull: {
    flexDirection: 'row',
  },
  refTimeText: {
    fontFamily: constants.fonts.family,
    fontSize: 15,
  },
  rightHalf: {
    height,
    justifyContent: 'flex-start',
    paddingLeft: 5,
    width,
  },
  subText: {
    color: colors.subText,
    fontFamily: constants.fonts.family,
    fontSize: 10,
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
  <View style={[Styles.refTimeContainer, { bottom: props.bottom }]}>
    <View style={Styles.leftHalf}>
      <TouchableHighlight
        onPress={props.onPress}
        style={Styles.leftContents}
        underlayColor={colors.underlay}
      >
        <View>
        </View>
      </TouchableHighlight>
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
          <Text style={[Styles.refTimeText, Styles.msec]}>
            .{props.hundredths}
          </Text>
        </View>
        <Text style={Styles.subText}>
          {props.ampm} {props.day} {props.month} {props.dayOfMonth}, {props.year}
        </Text>
      </Fragment>
    </TouchableHighlight>
  </View>
)

export default RefTime;
