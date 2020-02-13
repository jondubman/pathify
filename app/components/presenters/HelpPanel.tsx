import React, {
} from 'react';

import {
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import HelpButtonContainer from 'containers/HelpButtonContainer';
import { HelpPanelProps } from 'containers/HelpPanelContainer';
import constants from 'lib/constants';

const colors = constants.colors.helpPanel;
const {
  rightOffset,
  subpanelTopOffset,
  topOffset,
} = constants.helpPanel;

const Styles = StyleSheet.create({
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
  subpanel: {
  },
  subpanelContents: {
  },
  subpanels: {
    top: subpanelTopOffset,
  },
  switch: {
  },
  switchContainer: {
    position: 'absolute',
  },
  switchView: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
  },
  tipsSwitchLabel: {
    color: colors.tipsLabel,
    fontFamily: constants.tips.fontFamily,
    fontSize: constants.tips.fontSize,
    fontWeight: constants.tips.fontWeight,
    marginLeft: 20,
    margin: 10,
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
    return (
      <React.Fragment>
        { props.open ?
          <View style={Styles.panel}>
            <View style={Styles.subpanels}>
              <View style={Styles.subpanel}>
                <View style={Styles.subpanelContents}>
                  <View style={Styles.switchContainer}>
                    <View style={Styles.switchView}>
                      <Text style={Styles.tipsSwitchLabel}>
                        YELLOW LABELS
                      </Text>
                      <View style={Styles.switch}>
                        <View style={{ marginLeft: 2 }}>
                          <Switch
                            ios_backgroundColor={colors.background}
                            onValueChange={props.onSetTipsEnabled}
                            thumbColor={constants.colors.helpPanel.tipsThumb}
                            trackColor={colors.track}
                            value={props.tipsEnabled}
                          />
                        </View>
                      </View>
                    </View>
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
