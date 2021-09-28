// SettingsPanel supports setting map style and opacity (with a slider).

import _ from 'lodash'; // for _.throttle

import React, {
} from 'react';

import {
  StyleSheet,
  Switch,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import Slider from '@react-native-community/slider';

import SettingsButtonContainer from 'containers/SettingsButtonContainer';
import { SettingsPanelProps } from 'containers/SettingsPanelContainer';
import constants, { MapStyle } from 'lib/constants';
import utils from 'lib/utils';

const colors = constants.colors.settingsPanel;
const {
  height,
  leftOffset,
} = constants.settingsPanel;

const subpanelLeft = 10;

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
    fontFamily: constants.fonts.family,
    fontSize: constants.fonts.sizes.choiceLabel,
    fontWeight: 'normal',
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
    borderRadius: constants.sliders.borderRadius,
    position: 'relative',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
  },
  opacitySliderView: {
    backgroundColor: colors.opacitySliderBackground,
    borderRadius: constants.sliders.borderRadius,
    width: constants.panelWidth - subpanelLeft * 2 - 12,
  },
  panel: {
    backgroundColor: colors.background,
    borderRadius: constants.borderRadiusLarge,
    borderColor: colors.border,
    borderWidth: 1,
    justifyContent: 'flex-start',
    left: leftOffset,
    height,
    paddingLeft: constants.buttonOffset,
    position: 'absolute',
    width: constants.panelWidth,
  },
  subpanel: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    marginBottom: 10,
  },
  subpanelContents: {
    marginTop: 5,
  },
  subpanels: { // containing View
    left: subpanelLeft,
    top: constants.settingsPanel.subpanelTopOffset,
  },
  switch: {
  },
  switchContainer: {
    height: 50,
  },
  switchLabel: {
    paddingTop: 8, // align vertically with center of switch
  },
  switchView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginRight: 25,
  },
  text: {
    color: constants.fonts.colors.default,
    fontSize: constants.fonts.sizes.choice,
    fontWeight: 'bold',
    margin: constants.buttonOffset,
  },
  view: {
    position: 'absolute',
  },
})

const initialState = {
}
type State = Readonly<typeof initialState>

class SettingsPanel extends React.Component<SettingsPanelProps> {

  readonly state: State = initialState;

  constructor(props: any) {
    super(props);
    this.onValueChange = _.throttle(this.onValueChange.bind(this), constants.timing.opacitySliderThrottle);
    this.onSlidingComplete = this.onSlidingComplete.bind(this);
    this.panelStyle = { ...Styles.panel, top: utils.safeAreaTop() }
  }

  onValueChange(value: number) {
    this.props.onSetMapOpacityPreview(value);
  }

  onSlidingComplete(value: number) {
    this.props.onSetMapOpacity(value);
  }

  panelStyle: {}

  render() {
    const switchColors = constants.colors.switches;
    const { props } = this;
    return (
      <View style={Styles.view}>
        {props.open ?
          <View style={Styles.view}>
            <View style={this.panelStyle}>
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
                          onPressIn={() => { props.onSelectMapStyle(mapStyle.name)} }
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

                <View style={Styles.subpanelContents}>
                  <View style={Styles.switchContainer}>
                    <View style={Styles.switchView}>
                      <View style={Styles.switchLabel}>
                        <Text style={Styles.choiceLabelText}>
                          COLORIZE ACTIVITIES
                        </Text>
                      </View>
                      <View style={Styles.switch}>
                        <Switch
                          ios_backgroundColor={switchColors.background}
                          onValueChange={props.onSetColorizeActivites}
                          thumbColor={switchColors.thumb}
                          trackColor={switchColors.track}
                          value={props.colorizeActivities}
                        />
                      </View>
                    </View>
                  </View>
                </View>

                <View style={Styles.subpanelContents}>
                  <View style={Styles.switchContainer}>
                    <View style={Styles.switchView}>
                      <View style={Styles.switchLabel}>
                        <Text style={Styles.choiceLabelText}>
                          SHOW SEQUENTIAL PATHS
                        </Text>
                      </View>
                      <View style={Styles.switch}>
                        <Switch
                          ios_backgroundColor={switchColors.background}
                          onValueChange={props.onSetShowSequentialPaths}
                          thumbColor={switchColors.thumb}
                          trackColor={switchColors.track}
                          value={props.showSequentialPaths}
                        />
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
        <SettingsButtonContainer />
      </View>
    )
  }
}

export default SettingsPanel;
