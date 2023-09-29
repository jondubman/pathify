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
  UICategory,
} from 'lib/intro';
import utils from 'lib/utils';
import log from 'shared/log';

import Swiper from 'react-native-swiper';

const bubbleRadius = 8;
const smallerRadius = 4;
const bottom = 30; // leaves room for Mapbox logo at the bottom

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
  restartButton: {
    backgroundColor: constants.colors.byName.black,
    borderColor: constants.colors.byName.darkerGray,
    borderRadius: constants.borderRadiusLarge,
    borderWidth: 2,
    paddingHorizontal: 5,
    paddingVertical: 15,
  },
  restartButtonLabelText: {
    color: constants.colors.byName.gray,
    fontFamily: constants.fonts.family,
    fontSize: 16,
  },
  restartButtonView: {
    left: 5,
    position: 'absolute',
  },
  slide: {
    alignItems: 'center', // horizontal
    backgroundColor: constants.colors.introPages.background,
    flex: 1,
    justifyContent: 'center', // vertical center by default
  },
  text: {
    color: constants.colors.byName.white,
    fontFamily: constants.fonts.family,
    fontSize: textFontSize,
    marginHorizontal: 20,
    marginBottom: 50, // affects centering
    marginTop: 0,
    textAlign: 'left',
  },
  swiper: {
  },
})

const headerColors = constants.colors.introPages.pageHeader;

const renderPagination = (index: number, total: number, swiper: Swiper) => {
  const { width } = utils.windowSize();
  const containingViewStyle = { ...Styles.paginationContainer, width };
  const pageBubbles = [] as React.ReactElement[];
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
  index: number = 0;

  constructor(props: IntroProps) {
    super(props);
    this.index = props.pageIndex;
    this.doNext = this.doNext.bind(this);
    this.onPressNext = this.onPressNext.bind(this);
    this.onPressReset = this.onPressReset.bind(this);
  }

  doNext() {
    const { props } = this;
    const currentPage = introPages[props.pageIndex];
    if (!currentPage.isFinalPage) { // TODO else?
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

  onPressReset() {
    const swiper = this._swiper;
    // if (swiper) {
    //   swiper.scrollTo(0);
    // }    
    // Note use of optional chaining, a relatively new TypeScript feature:
    // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html
    this.props.onPressReset();
    swiper?.forceUpdate();
  }

  render() {
    const { props } = this;
    const { pageIndex } = props;
    const currentPage = introPages[pageIndex];
    if (!currentPage) {
      return null;
    }
    const pageHasGrabBar = currentPage.ui.includes(UICategory.grabBar);
    const grabBarAtTop = pageHasGrabBar && !props.grabBarSnapIndexPreview;
    const { top } = props;
    const showRestartButton = currentPage.buttonRestart && !grabBarAtTop;
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
            {introPages.map((page: IntroPageTemplate, index: number) => {
              const headerStyle = [Styles.header, page.headerStyle, {color: page.headerColor}];
              const textStyle = [Styles.text, page.textStyle];
              let text = page.text;
              let dimPage = false;
              if (page.ui.includes(UICategory.grabBar)) { // special case
                headerStyle.push({ top: props.snapPositions[1] + 15});
                textStyle.push({ top: props.snapPositions[1] + 15 });
                if (props.grabBarSnapIndexPreview === 0) { // top position
                  dimPage = true;
                }
                if (props.grabBarSnapIndexPreview > 1) { // lowered position
                  headerStyle.push({ opacity: 0 });
                  text = page.textAlternate || text;
                  textStyle.push({ top: props.snapPositions[1] + 45 });
                }
              }
              const customPageStyle = dimPage ? {opacity: 0} : null;
              return (
                <View style={[Styles.slide, page.pageStyle, customPageStyle]} key={page.name}>
                  <Text style={headerStyle}>
                    {page.header}
                  </Text>
                  <Text style={textStyle}>{text}</Text>
                </View>
              )
            })}
          </Swiper>
          {currentPage.buttonNext ? (
            <View style={[Styles.nextButtonView, currentPage.buttonNextStyle]}>
              <TouchableHighlight
                onPress={currentPage.isFinalPage ? this.props.onPressDone : this.onPressNext}
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
        {showRestartButton ? (
          <View style={{...Styles.restartButtonView, top}}>
            <TouchableHighlight
              onPress={this.onPressReset}
              style={Styles.restartButton}
              underlayColor={constants.colors.byName.silver}
            >
              <View style={Styles.buttonLabelView}>
                <Text style={Styles.restartButtonLabelText}>
                  {currentPage.buttonRestart ? currentPage.buttonRestart.label : ''}
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
