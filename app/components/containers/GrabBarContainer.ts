import { connect } from 'react-redux';

import {
  AppAction,
  newAction,
} from 'lib/actions';
import { AppState } from 'lib/state';
import GrabBar from 'presenters/GrabBar';

interface GrabBarStateProps {
  pressed: boolean;
  top: number;
}

interface GrabBarDispatchProps {
  onMoved: (top: number) => void;
  onPressed: () => void;
  onReleased: () => void;
}

export type GrabBarProps = GrabBarStateProps & GrabBarDispatchProps;

const mapStateToProps = (state: AppState): GrabBarStateProps => {
  return {
    pressed: state.flags.grabBarPressed,
    top: state.options.grabBarTop,
  }
}

const mapDispatchToProps = (dispatch: Function): GrabBarDispatchProps => {
  const onMoved = (top: number) => {
    dispatch(newAction(AppAction.setAppOption, { grabBarTop: top }));
  }
  const onPressed = () => {
    dispatch(newAction(AppAction.flagEnable, 'grabBarPressed'));
  }
  const onReleased = () => {
    dispatch(newAction(AppAction.flagDisable, 'grabBarPressed'));
  }
  const dispatchers = {
    onMoved,
    onPressed,
    onReleased,
  }
  return dispatchers;
}

const GrabBarContainer = connect<GrabBarStateProps, GrabBarDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(GrabBar as any);

export default GrabBarContainer;
