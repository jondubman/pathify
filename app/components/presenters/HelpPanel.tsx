import React, {
} from 'react';

import {
  StyleSheet,
  Switch,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import HelpButtonContainer from 'containers/HelpButtonContainer';
import { HelpPanelProps } from 'containers/HelpPanelContainer';
import constants from 'lib/constants';
import log from 'shared/log';

const colors = constants.colors.helpPanel;
const {
  rightOffset,
  subpanelTopOffset,
  topOffset,
} = constants.helpPanel;

const Styles = StyleSheet.create({
  labelsSwitchLabel: {
    color: colors.labelsLabel,
    fontFamily: constants.labels.fontFamily,
    fontSize: constants.labels.fontSize,
    fontWeight: constants.labels.fontWeight,
    margin: 10,
    marginLeft: 0,
  },
  linkButton: {
    backgroundColor: constants.colors.links.background,
    borderColor: constants.colors.links.border,
    borderRadius: constants.buttonSize / 2,
    borderWidth: 2,
    padding: 5,
  },
  linkContainer: {
    margin: 10,
    marginVertical: 5,
    overflow: 'hidden',
    padding: 5,
  },
  linkIconView: {
    marginLeft: 10,
    marginTop: 2,
  },
  linkText: {
    alignSelf: 'center',
    color: constants.colors.links.text,
    fontFamily: constants.links.fontFamily,
    fontSize: constants.links.fontSize,
    fontWeight: constants.links.fontWeight,
  },
  linkView: {
    flexDirection: 'row',
  },
  panel: {
    backgroundColor: colors.background,
    borderRadius: constants.buttonSize / 2,
    borderColor: colors.border,
    borderWidth: 1,
    height: constants.panelHeight,
    justifyContent: 'flex-start',
    paddingRight: constants.buttonOffset,
    position: 'absolute',
    right: rightOffset,
    top: topOffset,
    width: constants.panelWidth,
  },
  staticText: {
    color: constants.colors.helpPanel.staticText,
    fontFamily: constants.fonts.family,
    fontSize: 14,
  },
  staticTextView: {
    marginTop: 50, // TODO good for now
  },
  subpanel: {
  },
  subpanelContents: {
    flexDirection: 'column',
    marginLeft: 10,
  },
  subpanels: {
    top: subpanelTopOffset,
  },
  switch: {
    marginLeft: 2,
  },
  switchContainer: {
  },
  switchView: {
    alignItems: 'center', // vertically
    flexDirection: 'row',
    marginBottom: 10,
  },
})

const initialState = {
}
type State = Readonly<typeof initialState>

class HelpPanel extends React.Component<HelpPanelProps> {

  readonly state: State = initialState;

  constructor(props: any) {
    super(props);
  }

  render() {
    const colors = constants.colors.switch;
    const { props } = this;
    const staticText = props.version;
    return (
      <React.Fragment>
        { props.open ?
          <View style={Styles.panel}>
            <View style={Styles.subpanels}>
              <View style={Styles.subpanel}>
                <View style={Styles.subpanelContents}>
                  <View style={Styles.switchContainer}>
                    <View style={Styles.switchView}>
                      <Text style={Styles.labelsSwitchLabel}>
                        YELLOW LABELS
                      </Text>
                      <View style={Styles.switch}>
                        <Switch
                          ios_backgroundColor={colors.background}
                          onValueChange={props.onSetLabelsEnabled}
                          thumbColor={constants.colors.helpPanel.labelsThumb}
                          trackColor={colors.track}
                          value={props.labelsEnabled}
                        />
                      </View>
                    </View>
                  </View>
                  <View style={Styles.linkContainer}>
                    <TouchableHighlight
                      onPress={props.onReplayIntro}
                      style={Styles.linkButton}
                      underlayColor={constants.colors.topMenu.menuItemUnderlay}
                    >
                      <View style={Styles.linkView}>
                        <Text style={Styles.linkText}>
                          Replay intro
                        </Text>
                      </View>
                    </TouchableHighlight>
                  </View>
                  <View style={Styles.linkContainer}>
                    <TouchableHighlight
                      onPress={props.onLinkWeb}
                      style={Styles.linkButton}
                      underlayColor={constants.colors.topMenu.menuItemUnderlay}
                    >
                      <View style={Styles.linkView}>
                        <Text style={Styles.linkText}>
                          Pathify on the web
                        </Text>
                        <View style={Styles.linkIconView}>
                          <FontAwesome5
                            color={constants.colors.links.icon}
                            name='external-link-alt'
                            size={constants.links.fontSize}
                          />
                        </View>
                      </View>
                    </TouchableHighlight>
                  </View>
                  <View style={Styles.linkContainer}>
                    <TouchableHighlight
                      onPress={props.onLinkPrivacy}
                      style={Styles.linkButton}
                      underlayColor={constants.colors.topMenu.menuItemUnderlay}
                    >
                      <View style={Styles.linkView}>
                        <Text style={Styles.linkText}>
                          Privacy policy
                        </Text>
                        <View style={Styles.linkIconView}>
                          <FontAwesome5
                            color={constants.colors.links.icon}
                            name='external-link-alt'
                            size={constants.links.fontSize}
                          />
                        </View>
                      </View>
                    </TouchableHighlight>
                  </View>
                  <View style={Styles.staticTextView}>
                    <Text style={Styles.staticText}>
                      {staticText}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        :
        null
        }
        <HelpButtonContainer />
      </React.Fragment>
    )
  }
}

export default HelpPanel;
