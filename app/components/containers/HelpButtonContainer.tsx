import {
  GestureResponderEvent,
} from 'react-native';
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { dynamicAreaTop } from 'lib/selectors';
import { AppState } from 'lib/state';
import HelpButton from 'presenters/HelpButton';
import log from 'shared/log';

interface HelpButtonStateProps {
  enabled: boolean;
  topOffset: number;
}

interface HelpButtonDispatchProps {
  onPress: (event: GestureResponderEvent) => void;
}

export type HelpButtonProps = HelpButtonStateProps & HelpButtonDispatchProps;

const mapStateToProps = (state: AppState): HelpButtonStateProps => {
  return {
    enabled: state.flags.helpEnabled,
    topOffset: dynamicAreaTop(state),
  }
}

const mapDispatchToProps = (dispatch: Function): HelpButtonDispatchProps => {
  const onPress = () => {
    log.debug('HelpButton press');
    dispatch(newAction(AppAction.flagToggle, 'helpEnabled'));
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const HelpButtonContainer = connect<HelpButtonStateProps, HelpButtonDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(HelpButton as any);

export default HelpButtonContainer;
