// This renders a number of Pulsar components at once.

import React, {
  Component,
  Fragment,
} from 'react';

import Pulsar from 'presenters/Pulsar'; // singular
import { PulsarsProps } from 'containers/PulsarsContainer';

class Pulsars extends Component<PulsarsProps> {
  public render() {
    const { keySuffix, pulsars } = this.props;
    return (
      <Fragment>
        {Object.keys(pulsars).map((key => {
          const pulsar = pulsars[key];
          const { loc, color, visible } = pulsar;
          const compoundKey = key + keySuffix;
          return visible ?
            <Pulsar key={compoundKey} id={key} loc={loc} color={color} />
            :
            null
        }))}
      </Fragment>
    )
  }
}

export default Pulsars;
