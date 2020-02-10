import React, {
  Fragment,
} from 'react';
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  ViewStyle,
} from 'react-native';

import TopButtonContainer from 'containers/TopButtonContainer';
import { TopMenuProps } from 'containers/TopMenuContainer';
import constants from 'lib/constants';
import utils from 'lib/utils';

const colors = constants.colors.topMenu;

const {
  menuItemMarginHorizontal,
  menuItemMarginVertical,
} = constants.topMenu;

const Styles = StyleSheet.create({
  text: {
    alignSelf: 'center',
    backgroundColor: colors.menuItemBackground,
    color: constants.fonts.colors.default,
    fontSize: constants.fonts.sizes.menuItem,
    fontWeight: 'bold',
    marginHorizontal: menuItemMarginHorizontal,
    marginVertical: menuItemMarginVertical,
  },
})

const initialState = {
}
type State = Readonly<typeof initialState>

class TopMenu extends React.Component<TopMenuProps> {

  readonly state: State = initialState;

  constructor(props: any) {
    super(props);
    this.onPressZoomToActivity = this.onPressZoomToActivity.bind(this);
  }

  onPressZoomToActivity(event: GestureResponderEvent) {
    if (this.props.selectedActivityId) {
      this.props.onZoomToActivity(this.props.selectedActivityId);
    }
  }

  render() {
    const { props } = this;

    const menuItemStyle = {
      width: props.width - (constants.topMenu.borderWidth + menuItemMarginHorizontal) * 2,
    } as StyleProp<ViewStyle>;

    const panelStyle = {
      backgroundColor: colors.dimmerBackground,
      flexDirection: 'column',
      left: 0,
      height: utils.windowSize().height,
      justifyContent: 'center',
      position: 'absolute',
      top: 0,
      width: utils.windowSize().width,
    } as StyleProp<ViewStyle>;

    const subpanelStyle = {
      alignSelf: 'center',
      backgroundColor: colors.panelBackground,
      borderRadius: constants.buttonSize / 2,
      borderColor: colors.border,
      borderWidth: constants.topMenu.borderWidth,
      flexDirection: 'column',
      height: props.height,
      justifyContent: 'center',
      width: props.width,
    } as StyleProp<ViewStyle>;

    const subpanelContentsStyle = {
      justifyContent: 'space-evenly',
      height: props.height,
      marginHorizontal: menuItemMarginHorizontal,
      marginVertical: menuItemMarginVertical,
    } as StyleProp<ViewStyle>;

    const menuItemContainerStyle = {
      backgroundColor: colors.buttonBackground,
      borderRadius: constants.buttonSize / 2,
      overflow: 'hidden',
    } as StyleProp<ViewStyle>;

    const timelineSpaceStyle = { // for layout
      opacity: 0,
      height: props.timelineHeight,
    } as StyleProp<ViewStyle>;

    return (
      <Fragment>
        {props.open ?
          <TouchableHighlight
            onPressIn={props.onDismiss}
            style={panelStyle}
          >
            <Fragment>
              <View style={subpanelStyle}>
                <View style={subpanelContentsStyle}>
                  <View style={menuItemContainerStyle}>
                    <TouchableHighlight
                      onPress={this.onPressZoomToActivity}
                      style={menuItemStyle}
                      underlayColor={constants.colors.topMenu.menuItemUnderlay}
                    >
                      <Text style={Styles.text}>
                        Zoom Map to Activity
                      </Text>
                    </TouchableHighlight>
                  </View>
                  {(props.current || !props.selectedActivityId) ? null : (
                    <View style={menuItemContainerStyle}>
                      <TouchableHighlight
                        onPress={props.onDeleteActivity(props.selectedActivityId!)}
                        style={menuItemStyle}
                        underlayColor={constants.colors.topMenu.menuItemUnderlay}
                      >
                        <Text style={Styles.text}>
                          {'Delete Activity'}
                        </Text>
                      </TouchableHighlight>
                    </View>
                  )}
                  <View style={menuItemContainerStyle}>
                    <TouchableHighlight
                      onPressIn={props.onDismiss}
                      style={menuItemStyle}
                      underlayColor={constants.colors.topMenu.menuItemUnderlay}
                    >
                      <Text style={Styles.text}>
                        {'Close'}
                      </Text>
                    </TouchableHighlight>
                  </View>
                </View>
              </View>
              <View style={timelineSpaceStyle} />
            </Fragment>
          </TouchableHighlight>
          :
          null
        }
        <TopButtonContainer />
      </Fragment>
    )
  }
}

export default TopMenu;
