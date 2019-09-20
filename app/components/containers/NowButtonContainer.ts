import { connect } from 'react-redux';

import { AppState } from 'lib/state';
import NowButton from 'presenters/NowButton';

interface NowButtonStateProps {
}

interface NowButtonDispatchProps {
}

export type NowButtonProps = NowButtonStateProps & NowButtonDispatchProps;

const mapStateToProps = (state: AppState): NowButtonStateProps => {
  return {
  }
}

const mapDispatchToProps = (dispatch: Function): NowButtonDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const NowButtonContainer = connect<NowButtonStateProps, NowButtonDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(NowButton as any);

export default NowButtonContainer;
