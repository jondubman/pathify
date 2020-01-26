import React, {
} from 'react';

import {
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import { StartMenuProps } from 'containers/StartMenuContainer';
import constants from 'lib/constants';
import utils from 'lib/utils';

const colors = constants.colors.startMenu;
const {
  height,
} = constants.startMenu;
const width = utils.windowSize().width;

const Styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.background,
    borderTopLeftRadius: constants.buttonSize / 2,
    borderTopRightRadius: constants.buttonSize / 2,
    borderColor: colors.border,
    borderWidth: 1,
    height,
    justifyContent: 'flex-start',
    paddingRight: constants.buttonOffset,
    width,
  },
  subpanel: {
    alignSelf: 'flex-end',
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 10,
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

class StartMenu extends React.Component<StartMenuProps> {

  readonly state: State = initialState;

  constructor(props: any) {
    super(props);
  }

  render() {
    const { props } = this;
    return (
      <React.Fragment>
        { props.open ?
          <View style={[Styles.panel, {bottom: props.bottom}]}>
            <View>
              <View style={Styles.subpanel}>
              </View>
            </View>
          </View>
        :
        null
        }
      </React.Fragment>
    )
  }
}

export default StartMenu;
