import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import log from 'lib/log';
import GeolocationButton from 'presenters/GeolocationButton';

interface StateProps {
}

interface DispatchProps {
  onPress: (event: GestureResponderEvent) => void;
}

const mapStateToProps = (state: any): StateProps => {
  return {
  }
}

const mapDispatchToProps = (dispatch: any): DispatchProps => {
  const onPress = () => {
    log.debug('GeolocationButton press');
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const GeolocationButtonContainer = connect<StateProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(GeolocationButton as any); // TODO 'as any' addresses TS error 2345

export default GeolocationButtonContainer;
