import * as React from 'react';
import * as ReactDomServer from 'react-dom/server';

import {
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  ViewStyle,
} from 'react-native';

import { PopupMenuConfig, PopupMenuName, PopupMenusProps } from 'components/containers/PopupMenusContainer';
import constants from 'lib/constants';
import log from 'shared/log';

const Styles = StyleSheet.create({
  menus: {
  },
})

class PopupMenus extends React.Component<PopupMenusProps> {

  constructor(props: any) {
    super(props);
  }

  public render() {
    const { menus } = this.props;
    const renderMenu = (menuName: PopupMenuName, menuConfig: PopupMenuConfig) => {
      const { bottom, left, top, right, height, width } = menuConfig;
      const popupStyle = {
        backgroundColor: constants.colors.menus.background,
        borderBottomWidth: 0,
        borderColor: constants.colors.menus.border,
        borderTopLeftRadius: constants.buttonSize / 2,
        borderTopRightRadius: constants.buttonSize / 2,
        borderWidth: 1,
        left,
        bottom,
        height,
        width,
        position: 'absolute',
      } as ViewStyle;
      const Styles = StyleSheet.create({ popupStyle });
      return (
        <View style={Styles.popupStyle as any} key={menuName}>
        </View >
      )
    }
    return (
      <View>
        {[...menus].map(([menuName, menuConfig]) => (
          menuConfig.open ? renderMenu(menuName, menuConfig) : null
        ))}
      </View>
    )
  }
}

export default PopupMenus;
