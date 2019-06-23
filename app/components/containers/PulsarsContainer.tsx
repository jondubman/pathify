// Note that for now, state.options.pulsars does not include the location marker for the user, which is
// separately rendered in MapArea as an individual Pulsar component.

// Naming approach:
// PulsarsContainer is the react-redux container for state.options.pulsars.
// Pulsars plural is the corresponding presentational container that renders a number of Pulsar (singular).
// Pulsar (singular) is a presentational component for a single instance of a pulsar.

import { connect } from 'react-redux';

import Pulsars from 'presenters/Pulsars';
import { AppState } from 'lib/state';

export interface OptionalPulsar {
  lon: number;
  lat: number;
  color: string;
  visible: boolean;
}

// The key here is any unique string, whih could indicate a kind of pulsar (like 'origin'), or an id
export type OptionalPulsars = { [key: string]: OptionalPulsar }

interface PulsarsStateProps {
  pulsars: OptionalPulsars;
}

interface PulsarsDispatchProps {
}

export type PulsarsProps = PulsarsStateProps & PulsarsDispatchProps;

const mapStateToProps = (state: AppState): PulsarsStateProps => {
  // TODO should probably roll user location pulsar into this one. See showUserMarker in MapArea.
  return {
    pulsars: state.options.pulsars,
  }
}

const mapDispatchToProps = (dispatch: Function): PulsarsDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const PulsarsContainer = connect<PulsarsStateProps, PulsarsDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(Pulsars as any);

export default PulsarsContainer;
