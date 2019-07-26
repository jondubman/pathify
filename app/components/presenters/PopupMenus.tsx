import * as React from 'react';

import {
  Text,
  TouchableHighlight,
  View,
  ViewStyle,
} from 'react-native';

import { PopupMenuConfig, PopupMenuItem, PopupMenuName, PopupMenusProps } from 'containers/PopupMenusContainer';
import constants from 'lib/constants';
import log from 'shared/log';

class PopupMenus extends React.Component<PopupMenusProps> {

  constructor(props: any) {
    super(props);
  }

  public render() {
    const { menus } = this.props;
    const renderMenu = (menuName: PopupMenuName, menuConfig: PopupMenuConfig) => {
      const { bottom, left, top, right, height, width } = menuConfig; // TODO top, right
      const popupStyle = {
        backgroundColor: constants.colors.menus.background,
        borderBottomWidth: 0,
        borderColor: constants.colors.menus.border,
        borderTopLeftRadius: constants.buttonSize / 2,
        borderTopRightRadius: constants.buttonSize / 2,
        borderWidth: 1,
        position: 'absolute',
        height,
        width,
      } as ViewStyle;
      if (left) popupStyle.left = left;
      if (right) popupStyle.right = right;
      if (top) popupStyle.top = top;
      if (bottom) popupStyle.bottom = bottom;
      return (
        <View style={popupStyle} key={menuName}>
          {menuConfig.items.map((item: PopupMenuItem) => (
            <TouchableHighlight
              key={item.name}
              onPress={() => { log.debug('menu press', item.name); }}
              style={{ ...constants.menus.defaultItemStyle, ...item.itemStyle} as any}
              underlayColor={item.itemUnderlayColor || constants.menus.defaultItemUnderlayColor}
            >
              {item.displayText ? (
                <Text
                  style={{ ...constants.menus.defaultTextStyle, ...item.textStyle }}
                >
                  {item.displayText}
                </Text>
              ) : <View />}
            </TouchableHighlight>
          ))}
        </View>
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
