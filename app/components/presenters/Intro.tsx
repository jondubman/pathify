import * as React from 'react';

import {
  Component,
  Fragment,
} from 'react';
import {
  StyleSheet,
  StyleProp,
  Text,
  TouchableHighlight,
  View,
  ViewStyle,
} from 'react-native';

import { IntroProps } from 'containers/IntroContainer';
import constants from 'lib/constants';
import {
  introPages,
  IntroPageTemplate,
} from 'lib/intro';
import { dynamicAreaTop } from 'lib/selectors';
import utils from 'lib/utils';
import log from 'shared/log';

import Swiper from 'react-native-swiper';

const bubbleRadius = 8;
const smallerRadius = 4;
const bottom = 30;

const fontScaleFactor = Math.min(utils.windowWidthFactor(), utils.windowHeightFactor());
const headerFontSize = Math.floor(20 * fontScaleFactor);
const textFontSize = Math.floor(16 * fontScaleFactor);

const Styles = StyleSheet.create({
  buttonLabelText: {
    color: constants.colors.byName.black,
    fontFamily: constants.fonts.family,
    fontSize: 16,
  },
  buttonLabelView: {
  },
  closeButton: {
    backgroundColor: constants.colors.byName.black,
    borderColor: constants.colors.byName.darkerGray,
    borderRadius: constants.borderRadiusLarge,
    borderWidth: 2,
    paddingHorizontal: 5,
    paddingVertical: 15,
  },
  closeButtonLabelText: {
    color: constants.colors.byName.gray,
    fontFamily: constants.fonts.family,
    fontSize: 16,
  },
  closeButtonView: {
    right: 5,
    position: 'absolute',
  },
  containingView: {
    backgroundColor: 'transparent',
    bottom,
    position: 'absolute',
  },
  header: {
    color: constants.colorThemes.help,
    fontFamily: constants.fonts.family,
    fontSize: headerFontSize,
    fontWeight: 'bold',
    margin: 20,
    marginTop: 50,
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: constants.colors.byName.gray,
    borderRadius: constants.borderRadiusLarge,
    paddingHorizontal: 25,
    paddingVertical: 15,
  },
  nextButtonView: {
    bottom: 30,
    alignSelf: 'center',
    position: 'absolute',
  },
  paginationOval: {
    alignSelf: 'center', // horizontal
    backgroundColor: constants.colors.byName.gray,
    borderRadius: 30,
    flexDirection: 'row',
    height: (bubbleRadius * 2) + 6,
    justifyContent: 'space-around',
    width: 168, // big enough to show all the dots
  },
  paginationBubble: {
    alignSelf: 'center',
    backgroundColor: constants.colors.byName.black, // default
    borderRadius: bubbleRadius,
    height: bubbleRadius * 2,
    width: bubbleRadius * 2,
  },
  paginationBubbleEraser: {
    alignSelf: 'center', // vertical
    backgroundColor: constants.colors.byName.black, // default
    borderRadius: bubbleRadius,
    height: bubbleRadius * 2,
    width: bubbleRadius * 2,
  },
  paginationBubbleSeen: {
    alignSelf: 'center', // vertical
    backgroundColor: constants.colors.byName.black, // default
    borderRadius: smallerRadius,
    height: smallerRadius * 2,
    width: smallerRadius * 2,
    margin: bubbleRadius - smallerRadius,
  },
  paginationContainer: {
    position: 'absolute',  
    bottom: 0,
    flexDirection: 'column-reverse',
  },
  slide: {
    alignItems: 'center', // horizontal
    backgroundColor: constants.colors.introPages.background,
    flex: 1,
    justifyContent: 'center', // vertical
  },
  text: {
    color: constants.colors.byName.white,
    fontFamily: constants.fonts.family,
    fontSize: textFontSize,
    marginHorizontal: 20,
    marginBottom: 50,
    marginTop: 0,
    textAlign: 'left',
  },
  swiper: {
  },
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
      <View style={Styles.paginationBubbleEraser} key={i}>
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

class Intro extends Component<IntroProps> {

  _swiper: Swiper | null = null;

  constructor(props: IntroProps) {
    super(props);
    this.onPressNext = this.onPressNext.bind(this);
    this.doNext = this.doNext.bind(this);
  }

  doNext() {
    const { props } = this;
    const currentPage = introPages[props.pageIndex];
    if (currentPage.isFinalPage) {
      props.onPressClose();
    } else {
      const swiper = this._swiper;
      if (swiper) {
        swiper.scrollBy(1, true);
      }
    }
  }

  onPressNext() {
    const { props } = this;
    const currentPage = introPages[props.pageIndex];
    const swiper = this._swiper;
    if (swiper) {
      setTimeout(() => {
        if (currentPage.yieldsLocationRequest) {
          log.debug('Intro swiper requestLocationPermission');
          props.requestLocationPermission(this.doNext); // (if needed)
        } else {
          this.doNext();
        }
      }, 0)
    }
  }

  render() {
    const { props } = this;
    const { pageIndex } = props;
    const currentPage = introPages[pageIndex];
    if (!currentPage) {
      return null;
    }
    const top = dynamicAreaTop();
    const showCloseButton = currentPage.buttonClose &&
      (!currentPage.hideCloseButtonBeforeLocationRequest || props.requestedLocationPermission);
    return (
      <Fragment>
        <View style={Styles.containingView}>
          <Swiper
            index={props.pageIndex}
            loop={false}
            onIndexChanged={props.pageChanged}
            ref={(swiper) => {this._swiper = swiper}}
            renderPagination={renderPagination}
            showsButtons={false}
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
          {currentPage.buttonNext ? (
            <View style={Styles.nextButtonView}>
              <TouchableHighlight
                onPress={this.onPressNext}
                style={Styles.nextButton}
                underlayColor={constants.colors.byName.silver}
              >
                <View style={Styles.buttonLabelView}>
                  <Text style={Styles.buttonLabelText}>
                    {currentPage.buttonNext.label}
                  </Text>
                </View>
              </TouchableHighlight>
            </View>
          ) : null}
        </View>
        {showCloseButton ? (
          <View style={{...Styles.closeButtonView, top}}>
            <TouchableHighlight
              onPress={currentPage.isFinalPage ? props.onPressReset : props.onPressClose}
              style={Styles.closeButton}
              underlayColor={constants.colors.byName.silver}
            >
              <View style={Styles.buttonLabelView}>
                <Text style={Styles.closeButtonLabelText}>
                  {currentPage.buttonClose ? currentPage.buttonClose.label : ''}
                </Text>
              </View>
            </TouchableHighlight>
          </View>
        ) : null}
      </Fragment>
    )
  }
}

export default Intro;
