import React, {
  Fragment,
} from 'react';

import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  ViewStyle,
} from 'react-native';

import { StartMenuProps } from 'containers/StartMenuContainer';
import constants from 'lib/constants';
import utils from 'lib/utils';

const colors = constants.colors.startMenu;

const {
  menuItemMarginHorizontal,
  menuItemMarginVertical,
} = constants.startMenu;

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

class StartMenu extends React.Component<StartMenuProps> {

  readonly state: State = initialState;

  constructor(props: any) {
    super(props);
  }

  render() {
    const { props } = this;

    const menuItemStyle = {
      width: props.width - (constants.startMenu.borderWidth + menuItemMarginHorizontal) * 2,
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

    const subpanelContentsStyle = {
      justifyContent: 'space-evenly',
      height: props.height,
      marginHorizontal: menuItemMarginHorizontal,
      marginVertical: menuItemMarginVertical,
    } as StyleProp<ViewStyle>;

    const menuItemContainerStyle = {
      backgroundColor: colors.buttonBackground,
      borderRadius: constants.borderRadiusLarge,
      overflow: 'hidden',
    } as StyleProp<ViewStyle>;

    const subpanelStyle = {
      alignSelf: 'center',
      backgroundColor: colors.panelBackground,
      borderRadius: constants.borderRadiusLarge,
      borderColor: colors.border,
      borderWidth: constants.startMenu.borderWidth,
      flexDirection: 'column',
      height: props.height,
      justifyContent: 'center',
      width: props.width,
    } as StyleProp<ViewStyle>;

    const timelineSpaceStyle = { // for layout
      opacity: 0,
      height: props.timelineHeight,
    };

    return (
      <Fragment>
        { props.open ?
          <TouchableHighlight
            onPressIn={props.onDismiss}
            style={panelStyle}
          >
            <Fragment>
              <View style={subpanelStyle}>
                <View style={subpanelContentsStyle}>
                  {props.trackingActivity ? (
                    <View style={menuItemContainerStyle}>
                      <TouchableHighlight
                        onPress={props.onSelectEndActivity}
                        style={menuItemStyle}
                        underlayColor={constants.colors.startMenu.menuItemUnderlay}
                      >
                        <Text style={Styles.text}>
                          End Current Activity
                        </Text>
                      </TouchableHighlight>
                    </View>
                  ) : (
                    <View style={menuItemContainerStyle}>
                      <TouchableHighlight
                        onPress={props.onSelectNewActivity}
                        style={menuItemStyle}
                        underlayColor={constants.colors.startMenu.menuItemUnderlay}
                      >
                        <Text style={Styles.text}>
                          Start New Activity
                        </Text>
                      </TouchableHighlight>
                    </View>
                  )}
                  <View style={menuItemContainerStyle}>
                    <TouchableHighlight
                      onPressIn={props.onDismiss}
                      style={menuItemStyle}
                      underlayColor={constants.colors.startMenu.menuItemUnderlay}
                    >
                      <Text style={Styles.text}>
                        {props.trackingActivity ? 'Continue' : 'Close'}
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
      </Fragment>
    )
  }
}

export default StartMenu;
