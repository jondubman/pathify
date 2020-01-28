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

const Styles = StyleSheet.create({
  text: {
    alignSelf: 'center',
    backgroundColor: colors.menuItemBackground,
    color: constants.fonts.colors.default,
    fontSize: constants.fonts.sizes.choice,
    fontWeight: 'bold',
    marginVertical: 20,
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
      width: props.width - constants.startMenu.borderWidth * 2,
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
            onPress={props.onDismiss}
            style={panelStyle}
          >
            <Fragment>
              <View style={subpanelStyle}>
                {props.trackingActivity ? (
                  <TouchableHighlight
                    onPress={props.onSelectEndActivity}
                    style={menuItemStyle}
                    underlayColor={constants.colors.startMenu.menuItemUnderlay}
                  >
                    <Text style={Styles.text}>
                      End Current Activity
                    </Text>
                  </TouchableHighlight>
                ) : (
                  <TouchableHighlight
                    onPress={props.onSelectNewActivity}
                    style={menuItemStyle}
                    underlayColor={constants.colors.startMenu.menuItemUnderlay}
                  >
                    <Text style={Styles.text}>
                      Start New Activity
                    </Text>
                  </TouchableHighlight>
                )}
                <TouchableHighlight
                  onPress={props.onDismiss}
                  style={menuItemStyle}
                  underlayColor={constants.colors.startMenu.menuItemUnderlay}
                >
                  <Text style={Styles.text}>
                    {props.trackingActivity ? 'Continue' : 'Close'}
                  </Text>
                </TouchableHighlight>
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
