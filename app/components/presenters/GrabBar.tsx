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
  deltaY: number | undefined;
  snapY: number | undefined;
}

class GrabBar extends Component<GrabBarProps, GrabBarState> {

  _panResponder: PanResponderInstance;

  constructor(props: GrabBarProps) {
    super(props);
    this.state = {
      deltaY: 0,
      snapY: props.snapTop,
    }
    const topMin = dynamicTopBelowButtons();
    const listDetailsBoundary = topMin + constants.activityList.height;
    const detailsRowHeight = constants.activityDetails.height;
    const detailsRow1 = listDetailsBoundary + detailsRowHeight;
    const detailsRow2 = detailsRow1 + detailsRowHeight;
    const detailsRow3 = detailsRow2 + detailsRowHeight;
    const detailsRow4 = detailsRow3 + detailsRowHeight;
    const snapPositions = [
      topMin,
      listDetailsBoundary,
      detailsRow1,
      detailsRow2,
      detailsRow3,
      detailsRow4,
    ]
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
        const currentPosition = this.props.top + delta;
        let containedPosition: number | undefined;
        let snapTo: number | undefined;
        const lastIndex = snapPositions.length - 1;
        if (currentPosition <= snapPositions[0]) {
          snapTo = snapPositions[0];
          containedPosition = snapTo;
        } else if (currentPosition >= snapPositions[lastIndex]) {
          snapTo = snapPositions[lastIndex];
          containedPosition = snapTo;
        } else {
          containedPosition = currentPosition;
          for (let p = 0; p < lastIndex; p++) {
            const p1 = snapPositions[p];
            const p2 = snapPositions[p + 1];
            const d1 = currentPosition - p1;
            const d2 = p2 - currentPosition;
            if (d1 < 0 || d2 < 0) {
              continue;
            }
            // We are between p1 and p2. Which is closer?
            snapTo = (d1 < d2) ? p1 : p2;
            break;
          }
        }
        if (containedPosition && snapTo) {
          const previousSnapTo = this.state.snapY;
          if (snapTo !== previousSnapTo) {
            ReactNativeHaptic.generate('selection');
          }
          const deltaY = containedPosition - this.props.top;
          // this.props.onMoved(deltaY, snapTo);
          this.setState({
            deltaY,
            snapY: snapTo,
          })
        }
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        // User has released all touches while this view is the responder. This typically means a gesture has succeeded.
        ReactNativeHaptic.generate('notificationSuccess');
        const deltaY = this.state.deltaY || 0;
        log.trace('onPanResponderRelease', this.props.top + deltaY);
        const snapped = this.state.snapY || this.props.top + deltaY;
        this.props.onMoved(snapped, snapped);
        this.setState({ deltaY: 0, snapY: 0 });
        this.props.onReleased();
      },
      onPanResponderTerminate: (evt, gestureState) => {
        log.trace('onPanResponderTerminate');
        // Another component has become the responder, so this gesture should be cancelled
      },
    })
  }

  render() {
    const deltaY = this.state.deltaY || 0;
    const dragLayoutStyle = {
      flexDirection: 'column',
      position: 'absolute',
      top: this.props.top + deltaY,
    } as StyleProp<ViewStyle>;

    const snapY = this.state.snapY || 0;
    const snapLayoutStyle = {
      flexDirection: 'column',
      position: 'absolute',
      top: snapY,
    } as StyleProp<ViewStyle>;

    const {
      pressed,
    } = this.props;
    const dragStyle = pressed ? [lineStyleBase, lineStyleActive] : lineStyleBase;
    const snapStyle = lineStyleBase;
    return (
      <Fragment>
        <View {...this._panResponder.panHandlers} style={dragLayoutStyle}>
          <View pointerEvents="none" style={dragStyle} />
          <View pointerEvents="none" style={dragStyle} />
          <View pointerEvents="none" style={dragStyle} />
          <View pointerEvents="none" style={dragStyle} />
          <View pointerEvents="none" style={dragStyle} />
        </View>
        {this.props.top + deltaY === snapY ? null : (
          <View pointerEvents="none" style={snapLayoutStyle}>
            <View pointerEvents="none" style={snapStyle} />
            <View pointerEvents="none" style={snapStyle} />
            <View pointerEvents="none" style={snapStyle} />
            <View pointerEvents="none" style={snapStyle} />
            <View pointerEvents="none" style={snapStyle} />
          </View>
        )}
      </Fragment>
    )
  }
}

export default GrabBar;
