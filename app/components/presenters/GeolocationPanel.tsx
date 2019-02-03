import React, {
  Fragment,
} from 'react';

import {
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import constants, { GeolocationModeChoice } from 'lib/constants';
import GeolocationButtonContainer from 'containers/GeolocationButtonContainer';
import { GeolocationPanelProps } from 'containers/GeolocationPanelContainer';
const colors = constants.colors.geolocationPanel;
const { bottomOffset, height, leftOffset, subpanelTopMargin } = constants.geolocationPanel;

const Styles = StyleSheet.create({
  choice: {
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
    alignSelf: 'flex-start',
  },
  chosen: {
    backgroundColor: constants.colorThemes.geolocation,
  },
  chosenText: {
    color: 'black',
  },
  multiSelect: {
  },
  panel: {
    borderRadius: 5,
    borderBottomLeftRadius: constants.buttonSize / 2,
    borderTopRightRadius: height,
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
    fontWeight: 'bold',
    margin: 5,
    textAlign: 'center',
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
        <View style={[Styles.panel, { bottom: bottomOffset + props.marginBottom }]}>
          <View style={Styles.subpanels}>
            <View style={Styles.subpanel}>
              <View style={Styles.subpanelContents}>
                <View style={Styles.choiceLabel}>
                  <Text style={Styles.choiceLabelText}>
                    GEOLOCATION
                  </Text>
                </View>
                <View style={Styles.multiSelect}>
                  {constants.geolocationModeChoices.map((choice: GeolocationModeChoice, index: number) => (
                    <Fragment
                      key={index}
                    >
                      <TouchableHighlight
                        onPress={() => { props.setGeolocationMode(index) }}
                        style={[Styles.choice, (false) ? Styles.chosen : null]}
                        underlayColor={constants.colors.geolocationPanel.choiceUnderlay}
                      >
                          <Text style={[Styles.text, (false) ? Styles.chosenText : null]}>
                            {choice.name}
                          </Text>
                      </TouchableHighlight>
                    </Fragment>
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
