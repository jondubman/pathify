// Pulsar component - a pulsing dot to show dynamic locations on the map (chiefly, user location)
// Intended to be contained within a MapArea.

import * as turf from '@turf/helpers';

import React, {
  Component,
} from 'react';

import {
  Animated,
} from 'react-native';

import Mapbox from '@mapbox/react-native-mapbox-gl';

import constants from 'lib/constants';
import { LonLat } from 'shared/locations';

const pulseMin = 1;
const pulseMax = 3;
const pulseMsec = 1000;
const desiredRadius = 8;
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

  public readonly state: PulsarState = {
    pulse: new Animated.Value(pulseMin),
  }
  _pulseAnimation: any = null;

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { pulse } = this.state;
    const pulseOutAnimation = Animated.timing(pulse, {
      toValue: pulseMax,
      duration: pulseMsec,
    })
    const pulseInAnimation = Animated.timing(pulse, {
      toValue: pulseMin,
      duration: pulseMsec,
    })
    this._pulseAnimation = Animated.loop(
      Animated.sequence([ pulseOutAnimation, pulseInAnimation ]),
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
    // To yield a circle with desiredRadius, circleRadius should be smaller when pulse is larger.
    const radius = pulse.interpolate({
      inputRange: [ pulseMin, pulseMax ],
      outputRange: [ desiredRadius - pulseMin, desiredRadius - pulseMax ],
    })
    const opacity = pulse.interpolate({
      inputRange: [ pulseMin, pulseMax ],
      outputRange: [ 0.5, 1 ],
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
