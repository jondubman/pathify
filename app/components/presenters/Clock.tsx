import React, {
} from 'react';

import {
  StyleSheet,
  TouchableHighlight,
  View,
} from 'react-native';

import constants from 'lib/constants';
const colors = constants.colors.clock;
const {
  borderWidth,
  centerCircle,
  height,
  margin,
  hourHand,
  minuteHand,
  secondHand,
} = constants.clock;

import { ClockProps } from 'containers/ClockContainer';

// derived quantities
const diameter = height - margin * 2;
const radius = diameter / 2;
const hourHandLength = (radius - margin) * hourHand.lengthRatio;
const minuteHandLength = (radius - margin) * minuteHand.lengthRatio;

const degreesPerHour = 360 / 12;
const degreesPerMinute = 360 / 60;
const degreesPerSecond = degreesPerMinute;

const Styles = StyleSheet.create({
  clock: {
    alignSelf: 'flex-end',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth,
    borderRadius: radius,
    justifyContent: 'flex-end',
    marginTop: margin,
    marginRight: margin,
    height: diameter,
    width: diameter,
  },
  hourHand: {
    position: 'absolute',
    backgroundColor: hourHand.color,
    bottom: radius - margin,
    right: radius - margin + borderWidth - hourHand.thickness / 2,
    paddingHorizontal: hourHand.thickness / 2,
    paddingTop: radius * hourHand.lengthRatio,
    borderRadius: hourHand.thickness / 2,
  },
  minuteHand: {
    position: 'absolute',
    backgroundColor: minuteHand.color,
    bottom: radius - margin,
    right: radius - margin + borderWidth - minuteHand.thickness / 2,
    paddingHorizontal: minuteHand.thickness / 2,
    paddingTop: radius * minuteHand.lengthRatio,
    borderRadius: minuteHand.thickness / 2,
  },
  secondHand: {
    position: 'absolute',
    backgroundColor: secondHand.color,
    bottom: radius - margin,
    right: radius - margin + borderWidth - secondHand.thickness / 2,
    paddingHorizontal: secondHand.thickness / 2,
    paddingTop: radius * secondHand.lengthRatio,
    borderRadius: secondHand.thickness / 2,
  },
  centerCircle: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: centerCircle.color,
    height: centerCircle.radius,
    bottom: radius - margin,
    width: centerCircle.radius,
    borderRadius: centerCircle.radius,
  },
})

const hoursDeg = (hours: number, minutes: number) => (
  (hours % 12 + (minutes / 60)) * degreesPerHour
)
const hourHandRotation = (hours: number, minutes: number) => ({
  transform: [
    { translateY: hourHandLength / 2 },
    { rotate: `${hoursDeg(hours, minutes)}deg` },
    { translateY: -(hourHandLength / 2) },
  ]
})

const minutesDeg = (minutes: number) => (
  minutes * degreesPerMinute
)
const minuteHandRotation = (minutes: number) => ({
  transform: [
    { translateY: minuteHandLength / 2 },
    { rotate: `${minutesDeg(minutes)}deg` },
    { translateY: -(minuteHandLength / 2) },
  ]
})

const secondsDeg = (seconds: number) => (
  seconds * degreesPerSecond
)

const Clock = (props: ClockProps) => (
  <TouchableHighlight
    style={Styles.clock}
    onPress={props.onPress}
    underlayColor={colors.underlay}
  >
    <View>
      <View style={[Styles.hourHand, hourHandRotation(props.hours, props.minutes)] } />
      <View style={[Styles.minuteHand, minuteHandRotation(props.minutes)] } />
      <View style={[Styles.secondHand, minuteHandRotation(props.seconds)]} />
      <View style={Styles.centerCircle} />
    </View>
  </TouchableHighlight>
)

export default Clock;
