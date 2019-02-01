import React, {
} from 'react';

import {
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import constants, { GeolocationChoice } from 'lib/constants';
import GeolocationButtonContainer from 'containers/GeolocationButtonContainer';
import { GeolocationPanelProps } from 'containers/GeolocationPanelContainer';
const colors = constants.colors.geolocationPanel;
const { bottomOffset, height, leftOffset, rightOffset, subpanelTopMargin } = constants.geolocationPanel;

const Styles = StyleSheet.create({
  choice: {
    borderColor: constants.colorThemes.geolocation,
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
    alignSelf: 'center',
  },
  chosen: {
    backgroundColor: constants.colorThemes.geolocation,
  },
  chosenText: {
    color: 'black',
  },
  multiSelect: {
    alignItems: 'stretch',
    flexDirection: 'column',
  },
  panel: {
    borderRadius: constants.buttonSize / 2,
    borderColor: colors.border,
    borderWidth: 2,
    position: 'absolute',
    left: leftOffset,
    bottom: bottomOffset,
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
    marginTop: subpanelTopMargin,
  },
  subpanelContents: {
    flexDirection: 'column',
  },
  subpanels: {
  },
  text: {
    color: constants.fonts.colors.default,
    fontSize: constants.fonts.sizes.choice,
    // fontWeight: 'bold',
    margin: 5,
  },
  view: {
    position: 'absolute',
    bottom: 0,
  },
})

const GeolocationPanel = (props: GeolocationPanelProps) => (
  <View style={Styles.view}>
    {props.open ?
      <View style={Styles.view}>
        <View style={Styles.panel}>
          <View style={Styles.subpanels}>
            <View style={Styles.subpanel}>
              <View style={Styles.subpanelContents}>
                <View style={Styles.choiceLabel}>
                  <Text style={Styles.choiceLabelText}>
                    GEOLOCATION
                  </Text>
                </View>
                <View style={Styles.multiSelect}>
                  {constants.geolocationChoices.map((choice: GeolocationChoice, i: number) => (
                    <TouchableHighlight
                      onPress={() => {}}
                      style={[Styles.choice, (false) ? Styles.chosen : null]}
                      underlayColor={constants.colors.geolocationPanel.choiceUnderlay}
                    >
                      <Text style={[Styles.text, (false) ? Styles.chosenText : null]}>
                        {choice.name}
                      </Text>
                    </TouchableHighlight>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
      :
      null
    }
    <GeolocationButtonContainer />
  </View>
)

export default GeolocationPanel;
