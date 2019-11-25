import React, {
} from 'react';

import {
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import TopButtonContainer from 'containers/TopButtonContainer';
import { TopMenuProps } from 'containers/TopMenuContainer';
import constants from 'lib/constants';
import { centerline } from 'lib/selectors';

const colors = constants.colors.topMenu;
const {
  subpanelTopOffset,
  topOffset,
  width,
} = constants.topMenu;

const Styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.background,
    borderRadius: constants.buttonSize / 2,
    borderColor: colors.border,
    borderWidth: 1,
    height: constants.panelHeight,
    justifyContent: 'flex-start',
    left: centerline() - width / 2,
    paddingRight: constants.buttonOffset,
    position: 'absolute',
    top: topOffset,
    width,
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

class TopMenu extends React.Component<TopMenuProps> {

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
        <TopButtonContainer />
      </React.Fragment>
    )
  }
}

export default TopMenu;
