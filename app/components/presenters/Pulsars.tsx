// This renders a number of Pulsar components at once.

import React, {
  Component,
  Fragment,
} from 'react';

import Pulsar from 'presenters/Pulsar'; // singular
import { PulsarsProps } from 'containers/PulsarsContainer';
import { OptionalPulsars } from 'lib/state';

class Pulsars extends Component<PulsarsProps> {
  public render() {
    const pulsars = this.props.pulsars as OptionalPulsars;
    return (
      <Fragment>
        {Object.keys(pulsars).map((key => {
          const pulsar = pulsars[key];
          const { loc, color, visible } = pulsar;
          return visible ?
            <Pulsar key={key} id={key} loc={loc} color={color} />
            :
            null
        }))}
      </Fragment>
    )
  }
}

export default Pulsars;
