import React, {
  Component,
} from 'react';
import {
  PanResponder,
  PanResponderInstance,
  StyleSheet,
  View,
} from 'react-native';
import ReactNativeHaptic from 'react-native-haptic';

import PausedClockContainer from 'containers/PausedClockContainer';
import NowClockContainer from 'containers/NowClockContainer';
import { ZoomClockProps } from 'containers/ZoomClockContainer';
import constants from 'lib/constants';
import { centerline } from 'lib/selectors';
import log from 'shared/log';

const clockWidth = constants.clock.height;

const Styles = StyleSheet.create({
  clockCenter: {
    left: centerline() - clockWidth / 2,
    position: 'absolute',
  },
})

interface ZoomClockState {
  deltaY: number;
}

class ZoomClock extends Component<ZoomClockProps, ZoomClockState> {

  _panResponder: PanResponderInstance;

  constructor(props: ZoomClockProps) {
    super(props);
    this.state = {
      deltaY: 0,
    }
    this._panResponder = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      onPanResponderGrant: (evt, gestureState) => {
        ReactNativeHaptic.generate('impactMedium');
        log.trace('onPanResponderGrant');
        // The gesture has started. Show visual feedback so the user knows
        // what is happening!
        // gestureState.d{x,y} will be set to zero now
      },
      onPanResponderMove: (evt, gestureState) => {
        // The most recent move distance is gestureState.move{X,Y}
        // The accumulated gesture distance since becoming responder is
        // gestureState.d{x,y}
        log.trace('onPanResponderMove', gestureState.dx, gestureState.dy);
        let delta = -gestureState.dy;
        // deltaMax is the room we have to slide the clock down. For symmetry the upside should be identical.
        const deltaMax = constants.refTime.height - 5;
        if (delta > 0) {
          delta = Math.min(delta, deltaMax); // max delta is deltaMax
        } else {
          delta = Math.max(delta, -deltaMax); // min delta is -deltaMax
        }
        this.setState({ deltaY: delta });
        this.props.onZoom(-delta / deltaMax); // normalize to between -1 and 1, and reverse sign to match map zooming.
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        ReactNativeHaptic.generate('notificationSuccess');
        log.trace('onPanResponderRelease');
        this.setState({ deltaY: 0 });
        this.props.onZoom(0); // stop zooming
        // The user has released all touches while this view is the
        // responder. This typically means a gesture has succeeded
      },
      onPanResponderTerminate: (evt, gestureState) => {
        log.trace('onPanResponderTerminate');
        // Another component has become the responder, so this gesture
        // should be cancelled
      },
      // onShouldBlockNativeResponder: (evt, gestureState) => {
      //   // Returns whether this component should block native components from becoming the JS
      //   // responder. Returns true by default. Is currently only supported on android.
      //   return true;
      // },
    });
  }

  componentWillUnmount() {
    this.props.onZoom(0); // stop zooming
  }

  render() {
    const {
      bottom,
      nowMode,
    } = this.props;
    const {
      deltaY,
    } = this.state;
    return (
      <View {...this._panResponder.panHandlers} style={[Styles.clockCenter, { bottom: bottom + deltaY }]}>
        {nowMode ? <NowClockContainer interactive={true} key='NowClock' />
              : <PausedClockContainer interactive={true} key='PausedClock' />}
      </View>
    )
  }
}

export default ZoomClock;
