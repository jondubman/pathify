import * as React from 'react';

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { IntroProps } from 'containers/IntroContainer';
import constants from 'lib/constants';
import {
  introPages,
  IntroPageTemplate
} from 'lib/intro';

import Swiper from 'react-native-swiper';
// const { swiper } = constants.colors;

const Styles = StyleSheet.create({
  containingView: {
    position: 'absolute',  
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: constants.colors.introPages.background,
  },
  header: {
    color: constants.colors.byName.white,
    fontFamily: constants.fonts.family,
    fontSize: 20,
    fontWeight: 'bold',
    margin: 20,
    marginTop: 110,
    textAlign: 'center',
  },
  text: {
    color: constants.colors.byName.white,
    fontFamily: constants.fonts.family,
    fontSize: 16,
    fontWeight: 'normal',
    marginHorizontal: 20,
    marginBottom: 50,
    marginTop: 0,
    textAlign: 'left',
  },
  swiper: {},
})

const Intro = (props: IntroProps) => (
  <View style={Styles.containingView}>
    <Swiper
      index={props.page}
      loop={false}
      onIndexChanged={props.pageChanged}
      showsButtons={true}
      style={Styles.swiper}
    >
      {introPages.map((page: IntroPageTemplate) => (
        <View style={[Styles.slide, page.pageStyle]} key={page.name}>
          <Text style={[Styles.header, page.headerStyle]}>{page.header}</Text>
          <Text style={Styles.text}>{page.text}</Text>
        </View>
      ))}
    </Swiper>
  </View>
)

export default Intro;
