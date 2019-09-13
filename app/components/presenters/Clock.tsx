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
  border,
  centerCircle,
  height,
  margin,
  hourHand,
  minuteHand,
  secondHand,
  ticks,
} = constants.clock;

import { ClockProps } from 'containers/ClockContainer';

const degreesPerHour = 360 / 12;
const degreesPerMinuteOrSecond = 360 / 60;

// derived quantities
const borderWidth = border.width;
const diameter = height;
const radius = diameter / 2;
const hourHandLength = (radius - borderWidth) * hourHand.lengthRatio;
const minuteOrSecondHandLength = (radius - borderWidth) * minuteHand.lengthRatio;

const Styles = StyleSheet.create({
  clock: {
    alignSelf: 'flex-end',
    backgroundColor: colors.background,
    borderColor: border.color,
    borderWidth,
    borderRadius: radius,
    justifyContent: 'flex-end',
    marginBottom: margin,
    marginRight: margin,
    height: diameter,
    width: diameter,
  },
  hourHand: {
    position: 'absolute',
    backgroundColor: hourHand.color,
    bottom: radius - borderWidth,
    right: radius - borderWidth - hourHand.thickness / 2,
    paddingHorizontal: hourHand.thickness / 2,
    paddingTop: (radius - borderWidth) * hourHand.lengthRatio + hourHand.thickness / 2,
    borderRadius: hourHand.thickness / 2,
    // borderBottomLeftRadius: 0,
    // borderBottomRightRadius: 0,
  },
  minuteHand: {
    position: 'absolute',
    backgroundColor: minuteHand.color,
    bottom: radius - borderWidth,
    right: radius - borderWidth - minuteHand.thickness / 2,
    paddingHorizontal: minuteHand.thickness / 2,
    paddingTop: (radius - borderWidth) * minuteHand.lengthRatio,
    borderRadius: minuteHand.thickness / 2,
    // borderBottomLeftRadius: 0,
    // borderBottomRightRadius: 0,
  },
  secondHand: {
    position: 'absolute',
    backgroundColor: secondHand.color,
    bottom: radius - borderWidth,
    right: radius - borderWidth - secondHand.thickness / 2,
    paddingHorizontal: secondHand.thickness / 2,
    paddingTop: (radius - borderWidth) * secondHand.lengthRatio,
    borderRadius: secondHand.thickness / 2,
  },
  centerCircle: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: centerCircle.color,
    height: centerCircle.radius,
    bottom: radius - borderWidth,
    width: centerCircle.radius,
    borderRadius: centerCircle.radius,
  },
  majorTick: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: ticks.major.color,
    bottom: radius - borderWidth + (radius - ticks.major.length),
    height: ticks.major.length - borderWidth,
    width: ticks.major.width,
  },
  minorTick: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: ticks.minor.color,
    bottom: radius - borderWidth + (radius - ticks.minor.length),
    height: ticks.minor.length - borderWidth,
    width: ticks.minor.width,
  },
  now: {
    backgroundColor: colors.backgroundNow,
  },
  past: {
    backgroundColor: colors.backgroundPast,
  },
  stoppedNow: {
    backgroundColor: colors.backgroundStopped,
  },
  stoppedPast: {
    backgroundColor: colors.backgroundStoppedPast,
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

const minutesOrSecondsDegrees = (minutesOrSeconds: number) => (
  minutesOrSeconds * degreesPerMinuteOrSecond
)
const minuteOrSecondHandRotation = (minutesOrSeconds: number) => ({
  transform: [
    { translateY: minuteOrSecondHandLength / 2 },
    { rotate: `${minutesOrSecondsDegrees(minutesOrSeconds)}deg` },
    { translateY: -(minuteOrSecondHandLength / 2) },
  ]
})

const ClockTicks = () => {
  const clockTicks = [] as any;
  for (let i = 0; i < ticks.count; i++) {
    const isMajor = !(i % 5);
    const length = isMajor ? ticks.major.length : ticks.minor.length;
    const degrees = i * (360 / ticks.count);
    const translate = radius - length / 2;
    const styles = [
      isMajor ? Styles.majorTick : Styles.minorTick,
      {
        transform: [
          { translateY: translate },
          { rotate: `${degrees}deg` },
          { translateY: -translate },
        ]
      }
    ]
    clockTicks.push(<View key={i} style={styles} />);
  }
  return (
    <View>
      {clockTicks}
    </View>
  )
}

const clockBackgroundStyle = (props: ClockProps): Object => (
  props.timelineNow ? (props.stopped ? Styles.stoppedNow : Styles.now)
                    : (props.stopped ? Styles.stoppedPast : Styles.past)
)

const Clock = (props: ClockProps) => (
  <TouchableHighlight
    style={{ ...Styles.clock, ...clockBackgroundStyle(props)}}
    onPressIn={props.onPress}
    underlayColor={colors.underlay}
  >
    <View>
      <ClockTicks />
      <View style={[Styles.hourHand, hourHandRotation(props.hours, props.minutes)]} />
      <View style={[Styles.minuteHand, minuteOrSecondHandRotation(props.minutes)]} />
      <View style={[Styles.secondHand, minuteOrSecondHandRotation(props.seconds)]} />
      <View style={Styles.centerCircle} />
    </View>
  </TouchableHighlight>
)

export default Clock;
