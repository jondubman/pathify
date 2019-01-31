import React, {
} from 'react';

import {
  Slider,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import constants, { MapStyle } from 'lib/constants';
import utils from 'lib/utils';
import SettingsButtonContainer from 'containers/SettingsButtonContainer';
import { SettingsPanelProps } from 'containers/SettingsPanelContainer';
const colors = constants.colors.settingsPanel;
const { height, leftOffset, rightOffset, topOffset } = constants.settingsPanel;

const panelStyleBase = {
  borderRadius: constants.buttonSize / 2,
  borderColor: colors.border,
  borderWidth: 2,
  position: 'absolute',
  left: leftOffset,
  top: topOffset,
  height,
  width: utils.windowSize().width - (leftOffset + rightOffset),
}

const Styles = StyleSheet.create({
  choice: {
    borderColor: constants.colorThemes.settings,
    borderWidth: 1,
    justifyContent: 'center',
  },
  choiceLabel: {
    justifyContent: 'center',
  },
  choiceLabelText: {
    color: constants.colors.byName.gray,
    marginRight: 35,
  },
  chosen: {
    backgroundColor: constants.colorThemes.settings,
  },
  mapDimmer: {
    ...panelStyleBase as any,
    backgroundColor: constants.colors.appBackground,
    opacity: 1 - constants.map.opacityUnderPanels,
  },
  opacitySlider: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: constants.colorThemes.settings,

    position: 'relative',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
  },
  opacitySliderView: {
    backgroundColor: colors.opacitySliderBackground,
    width: 175,
  },
  panel: {
    ...panelStyleBase as any,
    backgroundColor: colors.background,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  subpanel: {
    display: 'flex',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'center',
    height: 40,
    marginBottom: 15,
  },
  subpanelContents: {
    flexDirection: 'row',
  },
  subpanels: {
    left: constants.settingsPanel.subpanelLeftOffset,
    top: constants.settingsPanel.subpanelTopOffset,
  },
  text: {
    color: constants.fonts.colors.default,
    fontSize: constants.fonts.sizes.label,
    fontWeight: 'bold',
    margin: 5,
  },
  view: {
    position: 'absolute',
  },
})

const SettingsPanel = (props: SettingsPanelProps) => (
  <View style={Styles.view}>
    { props.open ?
      <View style={Styles.view}>
        <View style={Styles.panel}>
          <View style={Styles.subpanels}>
            <View style={Styles.subpanel}>
              <View style={Styles.subpanelContents}>
                <View style={Styles.choiceLabel}>
                  <Text style={[Styles.text, Styles.choiceLabelText]}>
                    MAP
                  </Text>
                </View>
                {constants.mapStyles.map((mapStyle: MapStyle, i: number) => (
                  <TouchableHighlight
                    onPress={() => { props.onSelectMapStyle(mapStyle.name)}}
                    style={[Styles.choice, (mapStyle.name === props.mapStyle.name) ? Styles.chosen : null]}
                    underlayColor={constants.colors.settingsPanel.choiceUnderlay}
                  >
                    <Text style={Styles.text}>
                      {mapStyle.name}
                    </Text>
                  </TouchableHighlight>
                ))}
              </View>
            </View>
            <View style={Styles.subpanel}>
              <View style={Styles.subpanelContents}>
                <View style={Styles.choiceLabel}>
                  <Text style={[Styles.text, Styles.choiceLabelText]}>
                    OPACITY
                  </Text>
                </View>
                <View style={Styles.opacitySliderView} >
                  <Slider
                    minimumTrackTintColor={constants.colors.byName.azure}
                    style={Styles.opacitySlider}
                    value={0.5}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
      :
      null
    }
    <SettingsButtonContainer />
  </View>
)

export default SettingsPanel;
