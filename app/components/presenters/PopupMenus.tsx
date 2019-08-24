import _ from 'lodash'
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
  slider: {
    backgroundColor: constants.colors.byName.azure_dark,
  },
  sliderView: {
    marginLeft: constants.clockMenu.sliderMargin,
    marginRight: constants.clockMenu.sliderMargin,
    position: 'absolute',
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

const initialState = {
  initialSliderValue: null as number | null,
}
type State = Readonly<typeof initialState>

class PopupMenus extends React.Component<PopupMenusProps> {

  public readonly state: State = initialState;

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
                  <View style={{...Styles.sliderView, ...item.itemStyle}}>
                    <Slider
                      minimumTrackTintColor={constants.colors.byName.black}
                      maximumTrackTintColor={constants.colors.byName.black}
                      minimumValue={0}
                      maximumValue={1}
                      onSlidingComplete={(value: number) => {
                        this.setState({ initialSliderValue: null});
                        this.props.sliderMoved(item.name, value);
                      }}
                      onSlidingStart={(value: number) => {
                        this.setState({ initialSliderValue: value });
                      }}
                      onValueChange={
                        _.debounce((value: number) => {
                          this.props.sliderMoved(item.name, value);
                        }, 4) // max updates per second TODO constants
                      }
                      style={Styles.slider}
                      value={this.state.initialSliderValue || item.props.sliderValue}
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
