// This renders a number of Pulsar components at once.

import React, {
  Component,
  Fragment,
} from 'react';

import Pulsar from 'presenters/Pulsar'; // singular
import { PulsarsProps } from 'containers/PulsarsContainer';

class Pulsars extends Component<PulsarsProps> {
  render() {
    const { pulsars, revision } = this.props;
    return (
      <Fragment>
        {Object.keys(pulsars).map((key => {
          const pulsar = pulsars[key]; // key here is like 'pastLocation' or 'userLocation'.
          const {
            loc,
            color,
            visible,
          } = pulsar;
          const compoundKey = `${key}-${revision}`;
          return visible ?
            <Pulsar key={compoundKey} id={compoundKey} loc={loc} color={color} />
            :
            null
        }))}
      </Fragment>
    )
  }
}

export default Pulsars;
