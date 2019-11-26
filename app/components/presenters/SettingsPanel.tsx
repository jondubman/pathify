// SettingsPanel supports setting map style and opacity (with a slider).

import _ from 'lodash';

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

import SettingsButtonContainer from 'containers/SettingsButtonContainer';
import { SettingsPanelProps } from 'containers/SettingsPanelContainer';
import constants, { MapStyle } from 'lib/constants';

const colors = constants.colors.settingsPanel;
const {
  height,
  leftOffset,
  topOffset,
} = constants.settingsPanel;

const Styles = StyleSheet.create({
  choice: {
    borderColor: constants.colorThemes.settings,
    borderWidth: 1,
    justifyContent: 'center',
    paddingBottom: 3,
    paddingTop: 3,
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
    backgroundColor: colors.background,
    borderRadius: constants.buttonSize / 2,
    borderColor: colors.border,
    borderWidth: 1,
    // flex: 1,
    // flexDirection: 'column',
    justifyContent: 'flex-start',
    left: leftOffset,
    height,
    paddingLeft: constants.buttonOffset,
    position: 'absolute',
    top: topOffset,
    width: constants.panelWidth,
  },
  subpanel: {
    alignSelf: 'flex-start',
    display: 'flex',
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
}
type State = Readonly<typeof initialState>

class SettingsPanel extends React.Component<SettingsPanelProps> {

  public readonly state: State = initialState;

  constructor(props: any) {
    super(props);
    this.onValueChange = _.throttle(this.onValueChange.bind(this), constants.timing.opacitySliderThrottle);
    this.onSlidingComplete = this.onSlidingComplete.bind(this);
  }

  public onValueChange(value: number) {
    this.props.onSetMapOpacityPreview(value);
  }

  public onSlidingComplete(value: number) {
    this.props.onSetMapOpacity(value);
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
                    <Text style={Styles.choiceLabelText}>
                      MAP STYLE
                    </Text>
                    <View style={Styles.multiSelect}>
                      {props.mapStyles.map((mapStyle: MapStyle, index: number) => (
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
                    <Text style={Styles.choiceLabelText}>
                      MAP OPACITY
                    </Text>
                    <View style={Styles.opacitySliderView}>
                      <Slider
                        maximumTrackTintColor={constants.colors.byName.black}
                        minimumTrackTintColor={constants.colors.byName.white}
                        onValueChange={this.onValueChange}
                        onSlidingComplete={this.onSlidingComplete}
                        style={Styles.opacitySlider}
                        value={props.mapOpacity}
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
