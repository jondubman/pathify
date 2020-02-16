import React, {
  Component,
  Fragment,
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
}

class GrabBar extends Component<GrabBarProps, GrabBarState> {

  _panResponder: PanResponderInstance;
  _snap: number | undefined;
  _snapIndex: number | undefined;
  _top: number | undefined;

  constructor(props: GrabBarProps) {
    super(props);
    this._panResponder = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      onPanResponderGrant: (evt, gestureState) => {
        // The gesture has started. gestureState.d{x,y} will be set to zero now
        ReactNativeHaptic.generate('impactMedium');
        log.scrollEvent('onPanResponderGrant', 'props', this.props, this._snap, this._snapIndex, this._top);
        this.props.onPressed();
      },
      onPanResponderMove: (evt, gestureState) => {
        // The most recent move distance is gestureState.move{X,Y}
        // The accumulated gesture distance since becoming responder is gestureState.d{x,y}
        log.scrollEvent('onPanResponderMove', gestureState.dx, gestureState.dy, this._snap, this._snapIndex, this._top);
        let delta = gestureState.dy;
        const currentPosition = this.props.snap + delta;
        let containedPosition: number | undefined;
        let snap: number | undefined;
        let snapIndex: number | undefined;
        const snaps = snapPositions();
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
          const previousSnapIndex = (this._snapIndex === undefined) ? this.props.snapIndex : this._snapIndex;
          if (snapIndex !== previousSnapIndex) {
            ReactNativeHaptic.generate('selection');
          }
          const top = containedPosition;
          // snap = this.props.snapBack ? this.props.snapBackTo : snap;
          this._snap = snap;
          this._snapIndex = snapIndex;
          this._top = top;
          log.scrollEvent('onPanResponderMove now', this._snap, this._snapIndex, this._top);
          this.forceUpdate(); // TODO
          this.props.onMoved(snap, snapIndex!);
        }
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        // User has released all touches while this view is the responder. This typically means a gesture has succeeded.
        log.scrollEvent('onPanResponderRelease');
        ReactNativeHaptic.generate('notificationSuccess');
        // const snapped = (this.props.snapBack || !this._snap) ? this.props.snapBackTo : this._snap;
        this.props.onReleased((this._snapIndex === undefined) ? this.props.snapIndex : this._snapIndex);
        this._snap = undefined;
        this._snapIndex = undefined;
        this._top = undefined;
        // this.forceUpdate(); // TODO
      },
      onPanResponderTerminate: (evt, gestureState) => {
        log.scrollEvent('onPanResponderTerminate');
        // Another component has become the responder, so this gesture should be cancelled
      },
    })
  }

  render() {
    log.debug('GrabBar render', this._snap, this._snapIndex, this._top);
    const dragLayoutStyle = {
      flexDirection: 'column',
      position: 'absolute',
      top: (this._snap === undefined) ? this.props.snap : this._snap,
    } as StyleProp<ViewStyle>;

    const snapLayoutStyle = {
      flexDirection: 'column',
      position: 'absolute',
      top: (this._top === undefined) ? this.props.snap : this._top,
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
        {this._top === this.props.snap ? null : (
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
