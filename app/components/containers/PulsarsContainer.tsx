// Note that for now, state.options.pulsars does not include the location marker for the user, which is
// separately rendered in MapArea as an individual Pulsar component.

// Naming approach:
// PulsarsContainer is the react-redux container for state.options.pulsars.
// Pulsars plural is the corresponding presentational container that renders a number of Pulsar (singular).
// Pulsar (singular) is a presentational component for a single instance of a pulsar.

import { connect } from 'react-redux';

import { pulsars } from 'lib/selectors';
import { AppState, OptionalPulsars } from 'lib/state';
import Pulsars from 'presenters/Pulsars';

interface PulsarsStateProps {
  pulsars: OptionalPulsars;
}

interface PulsarsDispatchProps {
}

export type PulsarsProps = PulsarsStateProps & PulsarsDispatchProps;

const mapStateToProps = (state: AppState): PulsarsStateProps => {
  return {
    pulsars: pulsars(state),
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
