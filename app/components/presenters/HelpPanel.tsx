import React, {
} from 'react';

import {
  StyleSheet,
  Text,
  TouchableHighlight,
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
    // flex: 1,
    // flexDirection: 'column',
    height: constants.panelHeight,
    justifyContent: 'flex-start',
    paddingRight: constants.buttonOffset,
    position: 'absolute',
    right: rightOffset,
    top: topOffset,
    width: constants.panelWidth,
  },
  subpanel: {
    alignSelf: 'flex-end',
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 10,
  },
  subpanelContents: {
    flexDirection: 'column',
    height: 20,
    width: 20,
    backgroundColor: 'blue',
  },
  subpanels: {
    top: subpanelTopOffset,
  },
  text: {
    color: constants.fonts.colors.default,
    fontSize: constants.fonts.sizes.choice,
    fontWeight: 'bold',
    margin: 5,
  },
})

const initialState = {
}
type State = Readonly<typeof initialState>

class HelpPanel extends React.Component<HelpPanelProps> {

  public readonly state: State = initialState;

  constructor(props: any) {
    super(props);
  }

  public render() {
    const { props } = this;
    return (
      <React.Fragment>
        { props.open ?
          <View style={Styles.panel}>
            <View style={Styles.subpanels}>
              <View style={Styles.subpanel}>
                <View style={Styles.subpanelContents}>
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
