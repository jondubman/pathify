import React, {
  Component,
  Fragment,
} from 'react';
import {
  PanResponder,
  PanResponderInstance,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ReactNativeHaptic from 'react-native-haptic';

import PausedClockContainer from 'containers/PausedClockContainer';
import NowClockContainer from 'containers/NowClockContainer';
import LabelContainer from 'containers/LabelContainer';
import { ZoomClockProps } from 'containers/ZoomClockContainer';
import constants from 'lib/constants';
import { centerline } from 'lib/selectors';
import { labelTextStyle } from 'presenters/Label';
import log from 'shared/log';

const clockWidth = constants.clock.height;

const Styles = StyleSheet.create({
  clockCenter: {
    left: centerline() - clockWidth / 2,
    position: 'absolute',
  },
  labelView: {
    flexDirection: 'row',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
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
        // The gesture has started. gestureState.d{x,y} will be set to zero now
        ReactNativeHaptic.generate('impactMedium');
        log.trace('onPanResponderGrant');
        props.onPressed();
      },
      onPanResponderMove: (evt, gestureState) => {
        // The most recent move distance is gestureState.move{X,Y}
        // The accumulated gesture distance since becoming responder is gestureState.d{x,y}
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
        // normalize to between -1 and 1, and reverse sign to match map zooming.
        props.onZoom(-delta / deltaMax, delta);
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        // User has released all touches while this view is the responder. This typically means a gesture has succeeded.
        ReactNativeHaptic.generate('notificationSuccess');
        log.trace('onPanResponderRelease');
        this.setState({ deltaY: 0 });
        props.onZoom(0, 0); // stop zooming
        props.onReleased();
      },
      onPanResponderTerminate: (evt, gestureState) => {
        log.trace('onPanResponderTerminate');
        props.onReleased();
        // Another component has become the responder, so this gesture should be cancelled
      },
    })
  }

  componentWillUnmount() {
    this.props.onZoom(0, 0); // stop zooming
  }

  render() {
    const {
      bottom,
      nowMode,
      pressed,
    } = this.props;
    const {
      deltaY,
    } = this.state;
    const bottomStyle = {
      bottom: bottom + deltaY,
    }
    let pressedStyle = pressed ? {
      borderColor: constants.colors.zoomClock.border,
    } : {};
    return (
      <Fragment>
        {pressed ? (
          <View>
          </View>
        ) : (
          <View style={[Styles.labelView, { bottom: bottom - 16 }]}>
            <LabelContainer>
              <Text style={labelTextStyle}>
                TIMELINE
              </Text>
            </LabelContainer>
          </View>
        )}
        <View {...this._panResponder.panHandlers} style={[Styles.clockCenter, bottomStyle]}>
          {nowMode ? <NowClockContainer clockStyle={pressedStyle} interactive={true} key='NowClock' />
            : <PausedClockContainer clockStyle={pressedStyle} interactive={true} key='PausedClock' />}
        </View>
      </Fragment>
    )
  }
}

export default ZoomClock;
