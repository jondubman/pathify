import React, {
  Component,
} from 'react';

import {
  PanResponder,
  PanResponderInstance,
  StyleSheet,
  View,
} from 'react-native';

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

class ZoomClock extends Component<ZoomClockProps> {

  _panResponder: PanResponderInstance;

  constructor(props: ZoomClockProps) {
    super(props);
    this._panResponder = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      onPanResponderGrant: (evt, gestureState) => {
        log.trace('onPanResponderGrant');
        // The gesture has started. Show visual feedback so the user knows
        // what is happening!
        // gestureState.d{x,y} will be set to zero now
      },
      onPanResponderMove: (evt, gestureState) => {
        log.trace('onPanResponderMove', gestureState.dx, gestureState.dy);
        // The most recent move distance is gestureState.move{X,Y}
        // The accumulated gesture distance since becoming responder is
        // gestureState.d{x,y}
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        log.trace('onPanResponderRelease');
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

  render() {
    const {
      bottom,
      nowMode,
    } = this.props;
    return (
      <View {...this._panResponder.panHandlers} style={[Styles.clockCenter, { bottom }]}>
        {nowMode ? <NowClockContainer interactive={true} key='NowClock' />
              : <PausedClockContainer interactive={true} key='PausedClock' />}
      </View>
    )
  }
}

export default ZoomClock;
