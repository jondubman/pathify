import React, {
  Component,
} from 'react';

import {
  SafeAreaView, // TODO this is iOS only
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CONFIG_TEST } from 'react-native-dotenv';

import constants from '../../lib/constants';
import utils from '../../lib/utils';

const { height, width } = utils.windowSize();

const AppStyles = StyleSheet.create({
  app: {
    backgroundColor: constants.colors.appBackground,
  },
  safeAreaView: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  text: {
    padding: 5,
  },
})

class AppUI extends Component {
  constructor(props: any) {
    super(props);
    this.state = {
    }
  }

  public render() {
    return (
      <SafeAreaView pointerEvents="box-none" style={AppStyles.safeAreaView}>
        <View>
          <Text style={AppStyles.text}>
            {CONFIG_TEST}
          </Text>
        </View>
      </SafeAreaView>
    )
  }
}

export default AppUI;
