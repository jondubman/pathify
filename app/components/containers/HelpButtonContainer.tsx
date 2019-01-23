import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import log from 'lib/log';
import HelpButton from 'presenters/HelpButton';

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
    log.debug('HelpButton press');
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const HelpButtonContainer = connect<StateProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(HelpButton as any); // TODO 'as any' addresses TS error 2345

export default HelpButtonContainer;
