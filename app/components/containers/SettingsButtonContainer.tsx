import { connect } from 'react-redux';

import log from 'lib/log';
import SettingsButton from 'presenters/SettingsButton';

interface StateProps {
}

interface DispatchProps {
  onPress: Function;
}

const mapStateToProps = (state: any): StateProps => {
  return {
  }
}

const mapDispatchToProps = (dispatch: any): DispatchProps => {
  const onPress = () => {
    log.debug('SettingsButton press');
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const SettingsButtonContainer = connect<StateProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
) (SettingsButton as any); // TODO 'as any' addresses TS error 2345

export default SettingsButtonContainer;
