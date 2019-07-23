import { connect } from 'react-redux';

import { AppState } from 'lib/state';
import Menu from 'components/presenters/Menu';

interface MenuStateProps {
}

interface MenuDispatchProps {
}

export type MenuProps = MenuStateProps & MenuDispatchProps;

const mapStateToProps = (state: AppState): MenuStateProps => {
  return {
  }
}

const mapDispatchToProps = (dispatch: Function): MenuDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const MenuContainer = connect<MenuStateProps, MenuDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(Menu as any);

export default MenuContainer;
