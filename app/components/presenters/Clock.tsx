// Note this presenter component is used by multiple container components
// TODO improve separation of clock mechanism

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
  centerPoint,
  height,
  hourHand,
  minuteHand,
  secondHand,
  ticks,
} = constants.clock;

export interface ClockStateProps {
  clockStyle: any;
  current: boolean; // true means time on clock points to current activity, whether or not nowMode is enabled
  selected: boolean; // true means time on clock points to a selected activity, whether or not nowMode is enabled
  hours: number,
  milliseconds: number;
  minutes: number,
  seconds: number,
  stopped: boolean;
  nowMode: boolean;
  interactive: boolean; // comes from OwnProps
}

export interface ClockDispatchProps {
}

export type ClockProps = ClockStateProps & ClockDispatchProps;

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
    height: diameter,
    width: diameter,
  },
  inertClock: {
    alignSelf: 'flex-start',
    marginTop: (constants.activityList.activityHeight - diameter) / 2,
    marginLeft: constants.activityList.nowClockMarginLeft,
    opacity: 0.75,
  },
  hourHand: {
    position: 'absolute',
    backgroundColor: hourHand.color,
    bottom: radius - borderWidth,
    right: radius - borderWidth - hourHand.thickness / 2,
    paddingHorizontal: hourHand.thickness / 2,
    paddingTop: (radius - borderWidth) * hourHand.lengthRatio + hourHand.thickness / 2,
    borderRadius: hourHand.thickness / 2,
    // borderBottomLeftRadius: 2,
    // borderBottomRightRadius: 2,
  },
  minuteHand: {
    position: 'absolute',
    backgroundColor: minuteHand.color,
    bottom: radius - borderWidth,
    right: radius - borderWidth - minuteHand.thickness / 2,
    paddingHorizontal: minuteHand.thickness / 2,
    paddingTop: (radius - borderWidth) * minuteHand.lengthRatio,
    borderRadius: minuteHand.thickness / 2,
    // borderBottomLeftRadius: 2,
    // borderBottomRightRadius: 2,
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
    bottom: radius - borderWidth - 1,
    width: centerCircle.radius,
    borderRadius: centerCircle.radius,
  },
  centerPoint: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: centerPoint.color,
    height: centerPoint.radius,
    bottom: radius - centerPoint.radius,
    width: centerPoint.radius,
    borderRadius: centerPoint.radius,
  },
  majorTick: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: ticks.major.color,
    bottom: radius + borderWidth / 2 + (radius - ticks.major.length),
    height: ticks.major.length - borderWidth * 2,
    width: ticks.major.width,
  },
  minorTick: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: ticks.minor.color,
    bottom: radius + borderWidth / 2 + (radius - ticks.minor.length),
    height: ticks.minor.length - borderWidth * 2,
    width: ticks.minor.width,
  },
  now: {
    backgroundColor: colors.backgroundNow,
  },
  past: {
    backgroundColor: colors.backgroundPast,
  },
  pastButCurrent: {
    backgroundColor: colors.backgroundPastCurrent,
  },
  pastSelected: {
    backgroundColor: colors.backgroundPastSelected,
  },
  stoppedNow: { // debug mode - clock not ticking
    backgroundColor: colors.backgroundStopped,
  },
  stoppedPast: { // debug mode - clock not ticking
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

const clockBackgroundStyle = (props: ClockProps): Object => {
  const {
    current,
    nowMode,
    selected,
    stopped,
  } = props;
  // Note stopped is really just for debugging. It means the ticks are disbabled app-wide.
  if (nowMode) {
    if (stopped) {
      return Styles.stoppedNow; // debug-only
    } else {
      return Styles.now;
    }
  } else {
    if (stopped) {
      return Styles.stoppedPast; // debug-only
    } else {
      if (current) {
        return Styles.pastButCurrent;
      } else {
        if (selected) {
          return Styles.pastSelected;
        } else {
          return Styles.past;
        }
      }
    }
  }
}

const optionalStyle = (props: ClockProps): Object => {
  if (props.clockStyle) {
    return props.clockStyle;
  } else {
    return {};
  }
}

const ClockMechanics = (props: ClockProps) => (
  <View pointerEvents="none">
    <ClockTicks />
    <View style={[Styles.hourHand, hourHandRotation(props.hours, props.minutes)]} />
    <View style={[Styles.minuteHand, minuteOrSecondHandRotation(props.minutes + (props.seconds / 60))]} />
    <View style={[Styles.secondHand, minuteOrSecondHandRotation(props.seconds + (props.milliseconds / 1000))]} />
    <View style={Styles.centerCircle} />
    <View style={Styles.centerPoint} />
  </View>
)

const Clock = (props: ClockProps) => props.interactive ? (
  <View
    style={{ ...Styles.clock, ...clockBackgroundStyle(props), ...optionalStyle(props)}}
  >
    {ClockMechanics(props)}
  </View>
) : (
  <View
      style={{ ...Styles.clock, ...Styles.inertClock, ...clockBackgroundStyle(props), ...optionalStyle(props) }}
  >
    {ClockMechanics(props)}
  </View>
)

export default Clock; // Note Clock is not a pure functional component (thus cannot use React.memo)
