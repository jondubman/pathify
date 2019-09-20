// TODO this component is not imported in the project and is used only as a reference for creating new components

import { connect } from 'react-redux';

import { AppState } from 'lib/state';
import ComponentName from 'presenters/ComponentName';

interface ComponentNameStateProps {
}

interface ComponentNameDispatchProps {
}

export type ComponentNameProps = ComponentNameStateProps & ComponentNameDispatchProps;

const mapStateToProps = (state: AppState): ComponentNameStateProps => {
  return {
  }
}

const mapDispatchToProps = (dispatch: Function): ComponentNameDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const ComponentNameContainer = connect<ComponentNameStateProps, ComponentNameDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(ComponentName as any);

export default ComponentNameContainer;
