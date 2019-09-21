import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { AppState } from 'lib/state';
import NowButton from 'presenters/NowButton';
import log from 'shared/log';

interface NowButtonStateProps {
  hidden: boolean;
}

interface NowButtonDispatchProps {
  onPress: () => void;
}

export type NowButtonProps = NowButtonStateProps & NowButtonDispatchProps;

const mapStateToProps = (state: AppState): NowButtonStateProps => {
  return {
    hidden: false, // TODO
  }
}

const mapDispatchToProps = (dispatch: Function): NowButtonDispatchProps => {
  const onPress = () => {
    log.debug('NOW button press');
    dispatch(newAction(AppAction.flagEnable, 'timelineNow'));
  }
  const dispatchers = {
    onPress,
  }
  return dispatchers;
}

const NowButtonContainer = connect<NowButtonStateProps, NowButtonDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(NowButton as any);

export default NowButtonContainer;
