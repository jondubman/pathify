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

import TopButtonContainer from 'containers/TopButtonContainer';
import { TopMenuProps } from 'containers/TopMenuContainer';
import constants from 'lib/constants';
import utils from 'lib/utils';

const colors = constants.colors.topMenu;

const Styles = StyleSheet.create({
  text: {
    alignSelf: 'center',
    backgroundColor: colors.menuItemBackground,
    color: constants.fonts.colors.default,
    fontSize: constants.fonts.sizes.menuItem,
    fontWeight: 'bold',
    marginVertical: 20,
  },
})

const initialState = {
}
type State = Readonly<typeof initialState>

class TopMenu extends React.Component<TopMenuProps> {

  readonly state: State = initialState;

  constructor(props: any) {
    super(props);
  }

  render() {
    const { props } = this;

    const menuItemStyle = {
      width: props.width - constants.topMenu.borderWidth * 2,
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

    const timelineSpaceStyle = { // for layout
      opacity: 0,
      height: props.timelineHeight,
    };

    return (
      <Fragment>
        {props.open ?
          <TouchableHighlight
            onPress={props.onDismiss}
            style={panelStyle}
          >
            <Fragment>
              <View style={subpanelStyle}>
                {props.showingActivityDetails ? (
                  <TouchableHighlight
                    onPressIn={props.onHideActivityDetails}
                    style={menuItemStyle}
                    underlayColor={constants.colors.topMenu.menuItemUnderlay}
                  >
                    <Text style={Styles.text}>
                      Hide Activity Details
                    </Text>
                  </TouchableHighlight>
                ) : (
                    <TouchableHighlight
                      onPress={props.onShowActivityDetails}
                      style={menuItemStyle}
                      underlayColor={constants.colors.topMenu.menuItemUnderlay}
                    >
                      <Text style={Styles.text}>
                        Show Activity Details
                    </Text>
                    </TouchableHighlight>
                  )}
                {(props.current && props.selectedActivityId) ? null : (
                  <TouchableHighlight
                    onPress={props.onDeleteActivity(props.selectedActivityId)}
                    style={menuItemStyle}
                    underlayColor={constants.colors.topMenu.menuItemUnderlay}
                  >
                    <Text style={Styles.text}>
                      {'Delete Activity'}
                    </Text>
                  </TouchableHighlight>
                )}
                <TouchableHighlight
                  onPress={props.onDismiss}
                  style={menuItemStyle}
                  underlayColor={constants.colors.topMenu.menuItemUnderlay}
                >
                  <Text style={Styles.text}>
                    {'Close'}
                  </Text>
                </TouchableHighlight>
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
