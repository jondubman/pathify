// SettingsPanel supports setting map style and opacity (with a slider).

import _ from 'lodash';

import React, {
} from 'react';

import {
  // GestureResponderEvent,
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
import { centerline } from 'lib/selectors';

const colors = constants.colors.settingsPanel;
const {
  height,
  leftOffset,
  topOffset,
} = constants.settingsPanel;

const subpanelLeft = 10;
const switchLeft = constants.buttonSize + constants.buttonOffset;

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
    width: constants.panelWidth - subpanelLeft * 2 - 12,
  },
  panel: {
    backgroundColor: colors.background,
    borderRadius: constants.buttonSize / 2,
    borderColor: colors.border,
    borderWidth: 1,
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
    left: subpanelLeft,
    top: constants.settingsPanel.subpanelTopOffset,
  },
  switch: {
    alignSelf: 'center',
    marginTop: 10,
  },
  switchContainer: {
    height: constants.buttonSize + constants.buttonOffset,
    left: switchLeft,
    position: 'absolute',
    top: topOffset - constants.buttonOffset / 2,
  },
  switchView: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'center',
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
  }

  onValueChange(value: number) {
    this.props.onSetMapOpacityPreview(value);
  }

  onSlidingComplete(value: number) {
    this.props.onSetMapOpacity(value);
  }

  render() {
    const { props } = this;
    const colors = constants.colors.switch;
    const switchWidth = centerline() - (constants.buttonSize / 2) - switchLeft;
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
              </View>
            </View>
          </View>
          :
          null
        }
        {/* TODO cleanup
        <View style={[Styles.switchContainer, { width: switchWidth }]}>
          <View style={Styles.switchView}>
            <View style={Styles.switch}>
              <View style={{ marginLeft: 2 }}>
                <Switch
                  ios_backgroundColor={colors.background}
                  onValueChange={props.onSetShowTimeline}
                  thumbColor={colors.thumb}
                  trackColor={colors.track}
                  value={props.showTimeline}
                />
              </View>
              <Text style={Styles.choiceLabelText}>
                TIMELINE
              </Text>
            </View>
          </View>
        </View>
        */}
        <SettingsButtonContainer />
      </View>
    )
  }
}

export default SettingsPanel;
