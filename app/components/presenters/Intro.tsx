import * as React from 'react';

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { IntroProps } from 'containers/IntroContainer';
import constants from 'lib/constants';
import log from 'shared/log';

import Swiper from 'react-native-swiper';
const { swiper } = constants.colors;

const Styles = StyleSheet.create({
  containingView: {
    flex: 1,
  },
  slide1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: swiper.p1,
  },
  slide2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: swiper.p2,
  },
  slide3: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: swiper.p3,
  },
  slide4: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: swiper.p4,
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
        <Text style={Styles.text}>Pathify</Text>
      </View>
      <View style={Styles.slide2}>
        <Text style={Styles.text}>Privacy-first</Text>
      </View>
      <View style={Styles.slide3}>
        <Text style={Styles.text}>Activity Tracker</Text>
      </View>
      <View style={Styles.slide4}>
        <Text style={Styles.text}>and Timeline</Text>
      </View>
    </Swiper>
  </View>
)

export default Intro;
