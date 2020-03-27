import * as React from 'react';

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { IntroProps } from 'containers/IntroContainer';
import log from 'shared/log';

import Swiper from 'react-native-swiper';

const Styles = StyleSheet.create({
  containingView: {
    flex: 1,
  },
  slide1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#9DD6EB'
  },
  slide2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#97CAE5'
  },
  slide3: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#92BBD9'
  },
  text: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold'
  },
  swiper: {},
})

const onIndexChanged = (index: number) => {
  log.debug('Intro onIndexChanged', index);
}

const Intro = (props: IntroProps) => (
  <View style={Styles.containingView}>
    <Swiper
      loop={false}
      onIndexChanged={onIndexChanged}
      showsButtons={true}
      style={Styles.swiper}
    >
      <View style={Styles.slide1}>
        <Text style={Styles.text}>Hello Swiper</Text>
      </View>
      <View style={Styles.slide2}>
        <Text style={Styles.text}>Beautiful</Text>
      </View>
      <View style={Styles.slide3}>
        <Text style={Styles.text}>And simple</Text>
      </View>
    </Swiper>
  </View>
)

export default Intro;
