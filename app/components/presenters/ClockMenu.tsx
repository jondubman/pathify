import React, {
} from 'react';

import {
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import { ClockMenuProps } from 'containers/ClockMenuContainer';
import constants from 'lib/constants';
import { centerline } from 'lib/selectors';
// import log from 'shared/log';

const colors = constants.colors.clockMenu;
const {
  height,
  width,
} = constants.clockMenu;

const Styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.background,
    borderRadius: constants.buttonSize / 2,
    borderColor: colors.border,
    borderWidth: 1,
    height,
    justifyContent: 'flex-start',
    left: centerline() - width / 2,
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

class ClockMenu extends React.Component<ClockMenuProps> {

  public readonly state: State = initialState;

  constructor(props: any) {
    super(props);
  }

  public render() {
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

export default ClockMenu;
