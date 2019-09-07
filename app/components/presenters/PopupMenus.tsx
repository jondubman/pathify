import _ from 'lodash';

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

import { MenuItem } from 'containers/PopupMenusContainer'; // TODO temporarily hard-coding item.name in callbacks

interface State {
  initialValue?: number;
}

class PopupMenus extends React.Component<PopupMenusProps> {

  public readonly state: State = {
  }
  public onValueChanged;

  constructor(props: any) {
    super(props);
    this.onSlidingStart = this.onSlidingStart.bind(this);
    this.onValueChange = _.throttle(this.onValueChange.bind(this), 100); // 100 msec: not much!
    this.onValueChanged = ((value: number) => {
      this.onValueChange(value); // final value change
      this.props.slidingComplete(MenuItem.TIMELINE_ZOOM, value);
    }).bind(this);
  }

  public onSlidingStart(value: number) {
    this.props.slidingStart(MenuItem.TIMELINE_ZOOM, value);
  }

  public onValueChange(value: number) {
      this.props.sliderMoved(MenuItem.TIMELINE_ZOOM, value);
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
                      onSlidingComplete={this.onValueChanged}
                      onSlidingStart={this.onSlidingStart}
                      onValueChange={this.onValueChange}
                      style={Styles.slider}
                      value={item.props.sliderValue}
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
        {[...menus].map(([menuName, menuConfig]) => (
          menuConfig.open ? renderMenu(menuName, menuConfig) : null
        ))}
      </View>
    )
  }
}

export default PopupMenus;
