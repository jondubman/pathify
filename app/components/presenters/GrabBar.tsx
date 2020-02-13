import React, {
  Component,
  Fragment,
} from 'react';
import {
  PanResponder,
  PanResponderInstance,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import ReactNativeHaptic from 'react-native-haptic';

import { GrabBarProps } from 'containers/GrabBarContainer';
import constants from 'lib/constants';
import {
  snapPositions,
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
  snap: number | undefined;
  snapIndex: number | undefined;
  top: number | undefined;
}

class GrabBar extends Component<GrabBarProps, GrabBarState> {

  _panResponder: PanResponderInstance;

  constructor(props: GrabBarProps) {
    super(props);
    this.state = {
      snap: undefined,
      snapIndex: undefined,
      top: undefined,
    }
    const snaps = snapPositions();
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
        log.trace('onPanResponderMove', this.props.snap, gestureState.dx, gestureState.dy);
        let delta = gestureState.dy;
        const currentPosition = this.props.snap + delta;
        let containedPosition: number | undefined;
        let snap: number | undefined;
        let snapIndex: number | undefined;
        const lastIndex = snaps.length - 1;
        if (currentPosition <= snaps[0]) {
          snap = snaps[0];
          containedPosition = snap;
          snapIndex = 0;
        } else if (currentPosition >= snaps[lastIndex]) {
          snap = snaps[lastIndex];
          containedPosition = snap;
          snapIndex = lastIndex;
        } else {
          containedPosition = currentPosition;
          for (let p = 0; p < lastIndex; p++) {
            const p1 = snaps[p];
            const p2 = snaps[p + 1];
            const d1 = currentPosition - p1;
            const d2 = p2 - currentPosition;
            if (d1 < 0 || d2 < 0) {
              continue;
            }
            // We are between p1 and p2. Which is closer?
            snap = (d1 < d2) ? p1 : p2;
            snapIndex = (d1 < d2) ? p : p + 1;
            break;
          }
        }
        if (containedPosition && snap) {
          const previousSnap = this.state.snap;
          if (snap !== previousSnap) {
            ReactNativeHaptic.generate('selection');
          }
          const top = containedPosition;
          this.setState({
            snap,
            snapIndex,
            top,
          })
          this.props.onMoved(snap, snapIndex!);
        }
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        // User has released all touches while this view is the responder. This typically means a gesture has succeeded.
        ReactNativeHaptic.generate('notificationSuccess');
        log.trace('onPanResponderRelease', this.props.snap);
        const snapped = this.state.snap || this.props.snap;
        this.setState({
          snap: snapped,
          top: snapped,
        })
        this.props.onReleased(snapped, this.state.snapIndex!);
      },
      onPanResponderTerminate: (evt, gestureState) => {
        log.trace('onPanResponderTerminate');
        // Another component has become the responder, so this gesture should be cancelled
      },
    })
  }

  render() {
    const dragLayoutStyle = {
      flexDirection: 'column',
      position: 'absolute',
      top: this.state.top || this.props.snap,
    } as StyleProp<ViewStyle>;

    const snapLayoutStyle = {
      flexDirection: 'column',
      position: 'absolute',
      top: this.state.snap || this.props.snap,
    } as StyleProp<ViewStyle>;

    const {
      pressed,
    } = this.props;
    const dragStyle = pressed ? [lineStyleBase, lineStyleActive] : lineStyleBase;
    const snapStyle = lineStyleBase;
    return (
      <Fragment key={this.props.key}>
        <View {...this._panResponder.panHandlers} style={dragLayoutStyle}>
          <View pointerEvents="none" style={dragStyle} />
          <View pointerEvents="none" style={dragStyle} />
          <View pointerEvents="none" style={dragStyle} />
          <View pointerEvents="none" style={dragStyle} />
          <View pointerEvents="none" style={dragStyle} />
        </View>
        {this.state.top === this.props.snap ? null : (
          <View pointerEvents="none" style={snapLayoutStyle}>
            <View style={snapStyle} />
            <View style={snapStyle} />
            <View style={snapStyle} />
            <View style={snapStyle} />
            <View style={snapStyle} />
          </View>
        )}
      </Fragment>
    )
  }
}

export default GrabBar;
