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

      const popupStyle = {
        backgroundColor: constants.colors.menus.background,
        borderColor: constants.colors.menus.border,
        borderWidth: 1,
        position: 'absolute',
        ...menuConfig.style,
      } as ViewStyle;

      const foo = (
        <View style={popupStyle} key={menuName}>
          {menuConfig.items.map((item: PopupMenuItem) => (
            <TouchableHighlight
              key={item.name}
              onPress={() => { log.debug('PopupMenuItem press', item.name); }}
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
      // log.debug(menuName, popupStyle);
      return foo;
    }
    return (
      <View>
        {[ ...menus ].map(([menuName, menuConfig]) => (
          menuConfig.open ? renderMenu(menuName, menuConfig) : null
        ))}
      </View>
    )
  }
}

export default PopupMenus;
