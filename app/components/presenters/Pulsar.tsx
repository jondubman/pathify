// Pulsar component - a pulsing dot to show dynamic locations on the map (chiefly, user location)
// Intended to be contained within a MapArea.

import * as turf from '@turf/helpers';

import React, {
  Component,
} from 'react';

import {
  Animated,
} from 'react-native';

import Mapbox from '@react-native-mapbox-gl/maps';

import constants from 'lib/constants';
import { LonLat } from 'shared/locations';

const pulseMin = 1;
const pulseMax = 4;
const pulseMsec = constants.timing.pulsarPulse;
const desiredRadius = 10;
const defaultCircleColor = constants.colors.user;

interface PulsarProps {
  id: string;
  loc: LonLat;
  color: string;
}

interface PulsarState {
  pulse: Animated.Value;
}

class Pulsar extends Component<PulsarProps, PulsarState> {

  readonly state: PulsarState = {
    pulse: new Animated.Value(pulseMin), // Start at pulseMin. We then animate to pulseMax, and back to pulseMin.
  }
  _pulseAnimation: any = null;

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { pulse } = this.state;
    const pulseOutAnimation = Animated.timing(pulse, {
      duration: pulseMsec,
      toValue: pulseMax,
    })
    const pulseInAnimation = Animated.timing(pulse, {
      duration: pulseMsec,
      toValue: pulseMin,
    })
    this._pulseAnimation = Animated.loop( // indefinitely
      Animated.sequence([pulseOutAnimation, pulseInAnimation]),
    )
    this._pulseAnimation.start();
  }

  render() {
    const { id, loc } = this.props;
    const circleShape: turf.Point = { // Point is a type of GeoJSON geometry object having only coordinates.
      type: 'Point',
      coordinates: loc,
    }
    const { pulse } = this.state;
    // pulse directly affects the circleStrokeWidth, which gets drawn outside the circle's canonical radius.
    // To yield a circle that always has desiredRadius, circleRadius is reduced when pulse is larger.
    const radius = pulse.interpolate({
      inputRange: [pulseMin, pulseMax],
      outputRange: [desiredRadius - pulseMin, desiredRadius - pulseMax],
    })
    const opacity = pulse.interpolate({
      inputRange: [pulseMin, pulseMax],
      outputRange: [0.25, 1],
    })
    const circleStyle = {
      circleRadius: radius,
      circleColor: this.props.color || defaultCircleColor,
      circleOpacity: opacity,
      circleStrokeWidth: pulse,
      circleStrokeColor: constants.colors.byName.white,
      circleStrokeOpacity: 1,
    }
    const pulsarId = id;

    return (
      <Mapbox.Animated.ShapeSource id={`pulsarShape-${pulsarId}`} shape={circleShape}>
        <Mapbox.Animated.CircleLayer id={`pulsarCircleLayer-${pulsarId}`} style={circleStyle} />
      </Mapbox.Animated.ShapeSource>
    )
  }
}

export default Pulsar;
