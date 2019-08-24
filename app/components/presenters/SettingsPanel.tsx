// SettingsPanel supports setting map style and opacity (with a slider).
import _ from 'lodash'
import React, {
} from 'react';

import {
  // GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import Slider from '@react-native-community/slider';

import constants, { MapStyle } from 'lib/constants';
import SettingsButtonContainer from 'containers/SettingsButtonContainer';
import { SettingsPanelProps } from 'containers/SettingsPanelContainer';
const colors = constants.colors.settingsPanel;
const { height, leftOffset, topOffset } = constants.settingsPanel;

const Styles = StyleSheet.create({
  choice: {
    borderColor: constants.colorThemes.settings,
    borderWidth: 1,
    justifyContent: 'center',
    paddingBottom: 3,
    paddingTop: 3,
  },
  choiceLabel: {
  },
  choiceLabelText: {
    color: constants.colors.byName.gray,
    fontSize: constants.fonts.sizes.choiceLabel,
    fontWeight: 'normal',
    marginBottom: 2,
  },
  chosen: {
    backgroundColor: constants.colorThemes.settings,
  },
  chosenText: {
    color: 'black',
  },
  multiSelect: {
    flexDirection: 'row',
  },
  opacitySlider: {
    borderWidth: 1,
    borderColor: constants.colorThemes.settings,
    borderRadius: 1,

    position: 'relative',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
  },
  opacitySliderView: {
    backgroundColor: colors.opacitySliderBackground,
    width: constants.panelWidth - 16, // bit narrower
  },
  panel: {
    borderRadius: constants.buttonSize / 2,
    borderColor: colors.border,
    borderWidth: 1,
    position: 'absolute',
    left: leftOffset,
    top: topOffset,
    height,

    backgroundColor: colors.background,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    paddingLeft: 6,
    width: constants.panelWidth,
  },
  subpanel: {
    display: 'flex',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    marginBottom: 10,
  },
  subpanelContents: {
    flexDirection: 'column',
  },
  subpanels: {
    top: constants.settingsPanel.subpanelTopOffset,
  },
  text: {
    color: constants.fonts.colors.default,
    fontSize: constants.fonts.sizes.choice,
    fontWeight: 'bold',
    margin: 5,
  },
  view: {
    position: 'absolute',
  },
})

const initialState = {
  initialSliderValue: null as number | null,
}
type State = Readonly<typeof initialState>

class SettingsPanel extends React.Component<SettingsPanelProps> {

  public readonly state: State = initialState;

  constructor(props: any) {
    super(props);
  }

  public render() {
    const { props } = this;
    return (
      <View style={Styles.view}>
        {props.open ?
          <View style={Styles.view}>
            <View style={Styles.panel}>
              <View style={Styles.subpanels}>
                <View style={Styles.subpanel}>
                  <View style={Styles.subpanelContents}>
                    <View style={Styles.choiceLabel}>
                      <Text style={Styles.choiceLabelText}>
                        MAP STYLE
                      </Text>
                    </View>
                    <View style={Styles.multiSelect}>
                      {constants.mapStyles.map((mapStyle: MapStyle, index: number) => (
                        <TouchableHighlight
                          key={index}
                          onPress={() => { props.onSelectMapStyle(mapStyle.name)} }
                          style={[Styles.choice, (mapStyle.name === props.mapStyle.name) ? Styles.chosen : null]}
                          underlayColor={constants.colors.settingsPanel.choiceUnderlay}
                        >
                          <Text style={[Styles.text, (mapStyle.name === props.mapStyle.name) ? Styles.chosenText : null]}>
                            {mapStyle.name}
                          </Text>
                        </TouchableHighlight>
                      ))}
                    </View>
                  </View>
                </View>
                <View style={Styles.subpanel}>
                  <View style={Styles.subpanelContents}>
                    <View style={Styles.choiceLabel}>
                      <Text style={Styles.choiceLabelText}>
                        MAP OPACITY
                      </Text>
                    </View>
                    <View style={Styles.opacitySliderView}>
                      <Slider
                        maximumTrackTintColor={constants.colors.byName.azure}
                        minimumTrackTintColor={constants.colors.byName.black}
                        onSlidingComplete={(value: number) => {
                          this.setState({ initialSliderValue: null });
                        }}
                        onSlidingStart={(value: number) => {
                          this.setState({ initialSliderValue: value });
                        }}
                        onValueChange={
                          _.debounce((value: number) => {
                            props.onSetMapOpacity(value);
                          }, 4) // max updates per second TODO constants
                        }
                        style={Styles.opacitySlider}
                        value={this.state.initialSliderValue || props.mapOpacity}
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
  }
}

export default SettingsPanel;
