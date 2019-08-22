import React, {
  Fragment,
} from 'react';

import {
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  ViewStyle,
} from 'react-native';

import Slider from '@react-native-community/slider';

const Styles = StyleSheet.create({
  opacitySlider: {
    backgroundColor: constants.colors.byName.azure_dark,
    // // borderWidth: 1,
    // borderColor: constants.colors.byName.blue,
  },
  opacitySliderView: {
    // marginLeft: 20,
    // marginRight: 20,
    marginBottom: 10,
    marginTop: 2,
    position: 'absolute',
    top: 0,
  },
})

import {
  PopupMenuConfig,
  PopupMenuItem,
  PopupMenuItemType,
  PopupMenuName,
  PopupMenusProps
} from 'containers/PopupMenusContainer';
import constants from 'lib/constants';
import log from 'shared/log';

class PopupMenus extends React.Component<PopupMenusProps> {

  constructor(props: any) {
    super(props);
  }

  public render() {
    const { menus } = this.props;
    const renderMenu = (menuName: PopupMenuName, menuConfig: PopupMenuConfig) => { // called in a loop below

      const popupStyle = {
        backgroundColor: constants.colors.menus.background,
        borderColor: constants.colors.menus.border,
        borderWidth: 1,
        position: 'absolute',
        ...menuConfig.style,
      } as ViewStyle;

      const contentsStyle = menuConfig.contentsStyle || {};

      return (
        <View style={popupStyle} key={menuName}>
          <View style={contentsStyle}>
            {menuConfig.items.map((item: PopupMenuItem) => (
              <View
               key={item.name}
               style={item.itemContainerStyle || constants.menus.defaultItemContainerStyle}
              >
                {/* BUTTON */}
                {!item.type || item.type === PopupMenuItemType.BUTTON ?
                  <TouchableHighlight
                    key={item.name}
                    onPress={() => {
                      log.debug('PopupMenuItem press', item.name);
                      this.props.menuItemSelected && this.props.menuItemSelected(item.name);
                    }}
                    style={{
                      ...constants.menus.defaultItemStyle,
                      ...menuConfig.defaultItemStyle!,
                      ...item.itemStyle} as ViewStyle}
                    underlayColor={item.itemUnderlayColor || constants.menus.defaultItemUnderlayColor}
                  >
                    <Fragment>
                      {item.displayText ? (
                        <Text
                          key='displayText'
                          style={{ ...constants.menus.defaultTextStyle as ViewStyle, ...item.textStyle }}
                        >
                          {item.displayText}
                        </Text>
                      ) : <View />}
                      {item.label ? (
                        <Text
                          key='label'
                          style={{ ...constants.menus.defaultLabelStyle as ViewStyle, ...item.labelStyle }}
                        >
                          {item.label}
                        </Text>
                      ) : <View />}
                    </Fragment>
                  </TouchableHighlight>
                : null }

                {/* SLIDER */}
                {item.type === PopupMenuItemType.SLIDER ?
                  <View style={{...Styles.opacitySliderView, ...item.itemStyle}}>
                    <Slider
                      minimumTrackTintColor={constants.colors.byName.black}
                      maximumTrackTintColor={constants.colors.byName.black}
                      minimumValue={0}
                      maximumValue={1}
                      onSlidingComplete={() => item.props.initialValue = null}
                      onSlidingStart={(value: number) => item.props.initialValue = value}
                      onValueChange={(value: number) => {
                        this.props.sliderMoved(item.name, value)
                      }}
                      style={Styles.opacitySlider}
                      value={item.props ? (item.props.initialValue || item.props.sliderValue) : 0}
                    />
                  </View>
                : null }
              </View>
            ))}
          </View>
        </View>
      )
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
