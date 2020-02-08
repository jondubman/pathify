import React, {
  Component,
} from 'react';
import {
  PanResponder,
  PanResponderInstance,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import ReactNativeHaptic from 'react-native-haptic';

import { GrabBarProps } from 'containers/GrabBarContainer';
import constants from 'lib/constants';
import {
  dynamicTopBelowButtons,
} from 'lib/selectors';
import utils from 'lib/utils';
import log from 'shared/log';

const { grabBar } = constants;

const lineStyleBase = {
  backgroundColor: constants.colors.grabBar.line,
  marginVertical: grabBar.spacing,
  height: grabBar.lineHeight,
  width: utils.windowSize().width,
} as StyleProp<ViewStyle>;

const lineStyleActive = {
  backgroundColor: constants.colors.grabBar.lineActive,
} as StyleProp<ViewStyle>;

interface GrabBarState {
  deltaY: number;
}

class GrabBar extends Component<GrabBarProps, GrabBarState> {

  _panResponder: PanResponderInstance;

  constructor(props: GrabBarProps) {
    super(props);
    const topMin = dynamicTopBelowButtons();
    const topMax = topMin + 400; // TODO
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
        this.props.onPressed();
      },
      onPanResponderMove: (evt, gestureState) => {
        // The most recent move distance is gestureState.move{X,Y}
        // The accumulated gesture distance since becoming responder is gestureState.d{x,y}
        log.trace('onPanResponderMove', this.props.top, gestureState.dx, gestureState.dy);
        let delta = gestureState.dy;
        if (this.props.top + delta < topMin) {
          delta = topMin - this.props.top;
        }
        if (this.props.top + delta > topMax) {
          delta = topMax - this.props.top;
        }
        this.setState({ deltaY: delta });
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        // User has released all touches while this view is the responder. This typically means a gesture has succeeded.
        ReactNativeHaptic.generate('notificationSuccess');
        log.trace('onPanResponderRelease', this.props.top + this.state.deltaY);
        this.props.onMoved(this.props.top + this.state.deltaY);
        this.setState({ deltaY: 0 });
        this.props.onReleased();
      },
      onPanResponderTerminate: (evt, gestureState) => {
        log.trace('onPanResponderTerminate');
        // Another component has become the responder, so this gesture should be cancelled
      },
    })
  }

  render() {
    const layoutStyle = {
      flexDirection: 'column',
      position: 'absolute',
      top: this.props.top + this.state.deltaY,
    } as StyleProp<ViewStyle>;
    const {
      pressed,
    } = this.props;
    const style = pressed ? [lineStyleBase, lineStyleActive] : lineStyleBase;
    return (
      <View {...this._panResponder.panHandlers} style={layoutStyle}>
        <View pointerEvents="none" style={style} />
        <View pointerEvents="none" style={style} />
        <View pointerEvents="none" style={style} />
        <View pointerEvents="none" style={style} />
        <View pointerEvents="none" style={style} />
      </View>
    )
  }
}

export default GrabBar;
