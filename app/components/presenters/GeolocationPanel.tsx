import React, {
  Fragment,
} from 'react';

import {
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import constants, { GeolocationModeChoice } from 'lib/constants';
import GeolocationButton from 'presenters/GeolocationButton';
import GeolocationButtonContainer from 'containers/GeolocationButtonContainer';
import { GeolocationPanelProps } from 'containers/GeolocationPanelContainer';

const colors = constants.colors.geolocationPanel;
const { bottomOffset, height, leftOffset } = constants.geolocationPanel;

const Styles = StyleSheet.create({
  choice: {
    padding: 3,
    paddingLeft: 0,
    position: 'absolute',
  },
  choiceLabel: {
    position: 'absolute',
    bottom: 15,
    left: constants.buttonSize + constants.buttonOffset * 2,
  },
  choiceLabelText: {
    color: 'white',
    fontFamily: 'Futura',
    fontSize: 12,
    fontWeight: 'normal',
  },
  chosen: {
  },
  chosenText: {
    color: constants.colors.byName.yellow,
  },
  panel: {
    borderRadius: constants.buttonSize / 2,
    borderColor: colors.border,
    borderWidth: 1,
    position: 'absolute',
    left: leftOffset,
    bottom: bottomOffset,
    height,

    backgroundColor: colors.background,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    width: constants.panelWidth,
  },
  text: {
    color: constants.fonts.colors.default,
    fontSize: constants.fonts.sizes.choice,
    textAlign: 'left',
  },
  view: {
    position: 'absolute',
    bottom: 0,
  },
})

const v = (i: number) => (i + 1) * (constants.buttonSize + 10);
const iconPos = [[0, v(0)], [0, v(1)], [0, v(2)], [0, v(3)]];

const labelOffsetX = constants.buttonSize + constants.buttonOffset * 2;
const labelOffsetY = 14;

const GeolocationPanel = (props: GeolocationPanelProps) => (
  <View style={Styles.view}>
    {props.open ?
      <View style={Styles.view}>
        <View style={[Styles.panel, { bottom: bottomOffset + props.marginBottom }]}>
          <View style={Styles.choiceLabel}>
            <Text style={Styles.choiceLabelText}>
              Geolocation
            </Text>
          </View>
          {constants.geolocationModeChoices.map((choice: GeolocationModeChoice, index: number) => (
            <Fragment
              key={index}
            >
              <TouchableHighlight
                onPress={() => { props.setGeolocationMode(index) }}
                style={[
                  Styles.choice,
                  (props.mode === index) ? Styles.chosen : null,
                  { left: iconPos[index][0] + labelOffsetX, bottom:iconPos[index][1] + labelOffsetY},
                ]}
                underlayColor={constants.colors.geolocationPanel.choiceUnderlay}
              >
                <Text style={[
                  Styles.text,
                  (props.mode === index) ? Styles.chosenText : null
                ]}>
                  {choice.name}
                </Text>
              </TouchableHighlight>
              <GeolocationButton
                bottomOffset={iconPos[index][1]}
                leftOffset={iconPos[index][0]}
                mode={index}
                onPress={() => { props.setGeolocationMode(index) }}
                open={props.mode === index}
              />
            </Fragment>
          ))}
        </View>
      </View>
      :
      null
    }
    <GeolocationButtonContainer />
  </View>
)

export default GeolocationPanel;
