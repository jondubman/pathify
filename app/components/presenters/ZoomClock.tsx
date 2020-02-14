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

const clockDiameter = constants.clock.height;
const deltaXMax = clockDiameter;
const deltaXChoiceThreshold = deltaXMax * 0.9;

const deltaYMax = constants.refTime.height - 5;
const lockThreshold = 5; // pixels

const Styles = StyleSheet.create({
  backTrack: {
    backgroundColor: constants.colors.zoomClock.backTrack,
    borderRadius: clockDiameter,
    height: clockDiameter,
    right: centerline() - deltaXMax / 2,
    position: 'absolute',
    width: clockDiameter * 2,
  },
  backTrackActive: {
    backgroundColor: constants.colors.zoomClock.backTrackActive,
  },
  clockCenter: {
    left: centerline() - deltaXMax / 2,
    position: 'absolute',
  },
  labelView: {
    flexDirection: 'row',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  nowTrack: {
    backgroundColor: constants.colors.zoomClock.nowTrack,
    borderRadius: clockDiameter,
    height: clockDiameter,
    left: centerline() - clockDiameter / 2,
    position: 'absolute',
    width: clockDiameter * 2,
  },
  nowTrackActive: {
    backgroundColor: constants.colors.zoomClock.nowTrackActive,
  },
  verticalTrack: {
    backgroundColor: constants.colors.zoomClock.verticalTrack,
    borderRadius: clockDiameter,
    height: deltaYMax * 2 + clockDiameter,
    left: centerline() - clockDiameter / 2,
    position: 'absolute',
    width: clockDiameter,
  },
  verticalTrackActive: {
    backgroundColor: constants.colors.zoomClock.verticalTrackActive,
  }
})

interface ZoomClockState {
  choiceMade: boolean;
  deltaX: number;
  deltaY: number;
  horizontalLock: boolean;
  verticalLock: boolean;
}

const initialState: ZoomClockState = {
  choiceMade: false,
  deltaX: 0,
  deltaY: 0,
  horizontalLock: false,
  verticalLock: false,
}

class ZoomClock extends Component<ZoomClockProps, ZoomClockState> {

  _panResponder: PanResponderInstance;

  constructor(props: ZoomClockProps) {
    super(props);
    this.state = initialState;
    this._panResponder = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (this.state.choiceMade) {
          log.trace('choiceMade');
        }
        return !this.state.choiceMade;
      },
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
        let { horizontalLock } = this.state;
        const { nowMode } = this.props;
        if (!this.state.verticalLock) {
          let deltaX = -gestureState.dx;
          if (deltaX > 0) {
            deltaX = Math.min(deltaX, nowMode ? deltaXMax : 0); // max deltaX is deltaXMax
          } else {
            deltaX = Math.max(deltaX, nowMode ? 0 : -deltaXMax); // min deltaX is -deltaXMax
          }
          log.trace('onPanResponderMove deltaX', deltaX);
          horizontalLock = this.state.horizontalLock || Math.abs(deltaX) > lockThreshold;
          let choiceMade = false;
          if (deltaX > deltaXChoiceThreshold) {
            ReactNativeHaptic.generate('impactMedium');
            this.props.onBackSelected();
            choiceMade = true;
          }
          if (-deltaX > deltaXChoiceThreshold) {
            ReactNativeHaptic.generate('impactMedium');
            this.props.onNowSelected();
            choiceMade = true;
          }
          this.setState({
            choiceMade: this.state.choiceMade || choiceMade,
            deltaX: deltaX,
            horizontalLock,
          })
          // TODO: stuff
        }
        if (this.props.allowZoom && !horizontalLock) {
          let deltaY = -gestureState.dy;
          // deltaYMax is the room we have to slide the clock down. For symmetry the upside should be identical.
          if (deltaY > 0) {
            deltaY = Math.min(deltaY, deltaYMax); // max deltaY is deltaYMax
          } else {
            deltaY = Math.max(deltaY, -deltaYMax); // min deltaY is -deltaYMax
          }
          log.trace('onPanResponderMove deltaY', deltaY);
          const verticalLock = this.state.verticalLock || Math.abs(deltaY) > lockThreshold;
          this.setState({
            deltaY: deltaY,
            verticalLock,
          })
          if (verticalLock) {
            // normalize to between -1 and 1, and reverse sign to match map zooming.
            props.onZoom(-deltaY / deltaYMax, deltaY);
          }
        }
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        // User has released all touches while this view is the responder. This typically means a gesture has succeeded.
        ReactNativeHaptic.generate('notificationSuccess');
        log.trace('onPanResponderRelease');
        this.setState(initialState);
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
      allowZoom,
      bottom,
      nowMode,
      pressed,
    } = this.props;
    const {
      deltaX,
      deltaY,
      horizontalLock,
      verticalLock,
    } = this.state;
    const bottomStyle = {
      bottom: verticalLock ? bottom + deltaY : bottom,
    }
    let pressedStyle = pressed ? {
      borderColor: constants.colors.zoomClock.border,
    } : {};
    const backTrackStyle = horizontalLock ? [Styles.backTrack, Styles.backTrackActive] : [Styles.backTrack];
    const nowTrackStyle = horizontalLock ? [Styles.nowTrack, Styles.nowTrackActive] : [Styles.nowTrack];
    const verticalTrackStyle = verticalLock ? [Styles.verticalTrack, Styles.verticalTrackActive] : Styles.verticalTrack;
    const horizontalPositionStyle = (horizontalLock ? { left: centerline() - clockDiameter / 2 - deltaX } : {})
    const clockViewStyle = [Styles.clockCenter, bottomStyle, horizontalPositionStyle];
    return (
      <Fragment>
        {pressed ? (
          <Fragment>
            {verticalLock ? null : (
              <Fragment>
                {!nowMode || deltaX < 0 ? null : (
                  <View pointerEvents="none" style={[...backTrackStyle, bottomStyle]}>
                  </View>
                )}
                {nowMode || deltaX > 0 ? null : (
                  <View pointerEvents="none" style={[...nowTrackStyle, bottomStyle]}>
                  </View>
                )}
              </Fragment>
            )}
            {!allowZoom || horizontalLock ? null : (
              <View pointerEvents="none" style={[verticalTrackStyle, { bottom: bottom - deltaYMax }]}>
              </View>
            )}
          </Fragment>
        ) : (
          <View style={[Styles.labelView, { bottom: bottom - 16 }]}>
            <LabelContainer>
              <Text style={labelTextStyle}>
                TIMELINE
              </Text>
            </LabelContainer>
          </View>
        )}
        <View {...this._panResponder.panHandlers} style={clockViewStyle}>
          {nowMode ? <NowClockContainer clockStyle={pressedStyle} interactive={true} key='NowClock' />
            : <PausedClockContainer clockStyle={pressedStyle} interactive={true} key='PausedClock' />}
        </View>
      </Fragment>
    )
  }
}

export default ZoomClock;
