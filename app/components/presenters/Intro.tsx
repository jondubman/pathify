import * as React from 'react';

import {
  StyleSheet,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { IntroProps } from 'containers/IntroContainer';
import constants from 'lib/constants';
import {
  introPages,
  IntroPageTemplate
} from 'lib/intro';
import utils from 'lib/utils';

import Swiper from 'react-native-swiper';

const bubbleRadius = 8;
const smallerRadius = 4;

const Styles = StyleSheet.create({
  containingView: {
    position: 'absolute',
  },
  header: {
    color: constants.colorThemes.help,
    fontFamily: constants.fonts.family,
    fontSize: 20,
    fontWeight: 'bold',
    margin: 20,
    marginTop: 50,
    textAlign: 'center',
  },
  paginationOval: {
    alignSelf: 'center',
    backgroundColor: constants.colors.byName.gray,
    borderRadius: 30,
    flexDirection: 'row',
    height: (bubbleRadius * 2) + 6,
    justifyContent: 'space-around',
    marginBottom: 30,
    width: 168, // TODO
  },
  paginationBubble: {
    alignSelf: 'center',
    backgroundColor: constants.colors.byName.black, // default
    borderRadius: bubbleRadius,
    height: bubbleRadius * 2,
    width: bubbleRadius * 2,
  },
  paginationBubbleEraser: {
    alignSelf: 'center',
    backgroundColor: constants.colors.byName.black, // default
    borderRadius: bubbleRadius,
    height: bubbleRadius * 2,
    width: bubbleRadius * 2,
  },
  paginationBubbleSeen: {
    alignSelf: 'center',
    backgroundColor: constants.colors.byName.black, // default
    borderRadius: smallerRadius,
    height: smallerRadius * 2,
    width: smallerRadius * 2,
    margin: bubbleRadius - smallerRadius,
  },
  paginationContainer: {
    position: 'absolute',  
    flexDirection: 'column-reverse',
  },
  slide: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: constants.colors.introPages.background,
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

const headerColors = constants.colors.introPages.pageHeader;

const renderPagination = (index: number, total: number, swiper: Swiper) => {
  const { height, width } = utils.windowSize();
  const containingViewStyle = { ...Styles.paginationContainer, height, width };
  const pageBubbles = [] as any[]; // TODO proper type?
  for (let i = 0; i < total; i++) {
    const defaultBubbleStyle = Styles.paginationBubble;
    let bubbleStyle: StyleProp<ViewStyle> = defaultBubbleStyle;
    const activeBubbleStyle = { ...defaultBubbleStyle, backgroundColor: headerColors[i] };
    const seenBubbleStyle = { ...Styles.paginationBubbleSeen, backgroundColor: headerColors[i] };
    if (i < index) bubbleStyle = seenBubbleStyle;
    if (i === index) bubbleStyle = activeBubbleStyle;    
    pageBubbles.push(
      <View style={Styles.paginationBubbleEraser}>
        <View style={bubbleStyle}>
        </View>
      </View>
    )
  }
  return (
    <View pointerEvents="none" style={containingViewStyle}>
      <View style={Styles.paginationOval}>
        {pageBubbles}
      </View>
    </View>
  )
}


const Intro = (props: IntroProps) => (
  <View style={Styles.containingView}>
    <Swiper
      index={props.page}
      loop={false}
      onIndexChanged={props.pageChanged}
      showsButtons={false}
      renderPagination={renderPagination}
      style={Styles.swiper}
    >
      {introPages.map((page: IntroPageTemplate, index: number) => (
        <View style={[Styles.slide, page.pageStyle]} key={page.name}>
          <Text style={{...Styles.header, ...page.headerStyle as any, color: headerColors[index]}}>
            {page.header}
          </Text>
          <Text style={Styles.text}>{page.text}</Text>
        </View>
      ))}
    </Swiper>
  </View>
)

export default Intro;
