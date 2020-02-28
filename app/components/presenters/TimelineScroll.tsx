import React, {
  PureComponent,
} from 'react';

import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
} from 'react-native';

import {
  DomainPropType,
} from 'victory-native';

import TimelineContainer from 'containers/TimelineContainer';
import { TimelineScrollProps } from 'containers/TimelineScrollContainer';
import constants from 'lib/constants';
import store from 'lib/store';
import utils from 'lib/utils';
import log from 'shared/log';
import { interval } from 'lib/timeseries';

const initialState = {
  zoomDomain: null as any,
}
type State = Readonly<typeof initialState>

const TimelineStyles = StyleSheet.create({
  scrollView: {
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 0,
  },
})

class TimelineScroll extends PureComponent<TimelineScrollProps> {

  readonly state: State = initialState;
  _scrollView: ScrollView | null = null;
  _scrolling: boolean = false;
  _timer: any;

  constructor(props: any) {
    super(props);
    this.clearTimer = this.clearTimer.bind(this);
    this.scrollToTime = this.scrollToTime.bind(this);
    this.setZoomDomainWhileScrolling = this.setZoomDomainWhileScrolling.bind(this);
    this.onContentSizeChange = this.onContentSizeChange.bind(this);
    this.onFinishScrolling = this.onFinishScrolling.bind(this);
    this.onMomentumScrollBegin = this.onMomentumScrollBegin.bind(this);
    this.onMomentumScrollEnd = this.onMomentumScrollEnd.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.onScrollBeginDrag = this.onScrollBeginDrag.bind(this);
    this.onScrollEndDrag = this.onScrollEndDrag.bind(this);
  }

  private clearTimer() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = undefined;
    }
  }

  // Auto-scroll to the correct spot after component is updated.
  componentDidUpdate(prevProps: TimelineScrollProps) {
    if (this._timer) {
      log.debug('timer active during scrolling?');
      this.clearTimer();
    }
    if (this._scrolling) {
      log.debug('componentDidUpdate during scrolling?');
    } else {
      const { scrollTime } = store.getState().options;
      setTimeout(() => { // This setTimeout is needed for the scroll to take effect.
        this.scrollToTime(scrollTime);
        log.scrollEvent('timelineScroll componentDidUpdate', prevProps, this.props);
      }, 0)
    }
  }

  componentWillUnmount() {
    log.trace('TimelineScroll componentWillUnmount');
    this.clearTimer();
    this.props.setTimelineScrolling(false);
  }

  setZoomDomainWhileScrolling(domain: DomainPropType) {
    log.trace('setZoomDomainWhileScrolling', domain);
    this.props.zoomDomainChanging(domain);
  }

  onContentSizeChange(contentWidth, contentHeight) {
    log.debug('onContentSizeChange', contentWidth, contentHeight);
  }

  onFinishScrolling(domain: DomainPropType) {
    const {
      setTimelineNow,
      setTimelineScrolling,
      zoomDomainChanged,
    } = this.props;
    this.clearTimer();
    this._scrolling = false;
    log.scrollEvent('onFinishScrolling', domain);
    const x = (domain as any).x as [number, number];
    const newTime = Math.min(utils.now(), (x[0] + x[1]) / 2);
    const rightNow = utils.now();
    setTimelineNow(newTime >= rightNow - constants.timing.timelineCloseToNow);
    zoomDomainChanged(domain);
    setTimelineScrolling(false);
  }

   onMomentumScrollBegin(event: NativeSyntheticEvent<NativeScrollEvent>) {
    this._scrolling = true;
    // The timer was only around to finish scrolling in case we are not momentum scrolling.
    this.clearTimer();
    log.scrollEvent('onMomentumScrollBegin');
    this.props.setTimelineScrolling(true);
  }

  onMomentumScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { yDomain } = constants.timeline;
    const {
      centerTime,
      scrollableWidth,
      scrollToX,
      visibleTime,
    } = this.props;
    const scrollableAreaTime = visibleTime * constants.timeline.widthMultiplier;
    const { x } = event.nativeEvent.contentOffset;
    const movedX = x - scrollToX;
    const timeDelta = (movedX / scrollableWidth) * scrollableAreaTime;
    const rightNow = utils.now();
    const newTime = Math.min(rightNow, centerTime + timeDelta);
    const domain: DomainPropType = {
      x: [newTime - scrollableAreaTime / 2, newTime + scrollableAreaTime / 2], // half on either side
      y: yDomain,
    }
    log.scrollEvent('onMomentumScrollEnd', newTime, rightNow, newTime - rightNow);
    this.onFinishScrolling(domain);
  }

  onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    log.scrollEvent('onScroll');
    if (!this._scrolling) {
      return;
    }
    const { yDomain } = constants.timeline;
    const {
      centerTime,
      scrollableWidth,
      scrollToX,
      visibleTime,
    } = this.props;
    const scrollableAreaTime = visibleTime * constants.timeline.widthMultiplier;
    log.scrollEvent('onScroll centerTime:', centerTime);
    const { x } = event.nativeEvent.contentOffset;
    const movedX = x - scrollToX;
    const timeDelta = (movedX / scrollableWidth) * scrollableAreaTime;
    const { minute } = interval;
    log.scrollEvent('movedX', movedX, 'scrollableAreaTime', Math.round(scrollableAreaTime) / minute, 'scrollableWidth',
      Math.round(scrollableWidth), 'timeDelta', Math.round(timeDelta) / minute);
    const rightNow = utils.now();
    const newTime = Math.min(rightNow, centerTime + timeDelta);
    const domain: DomainPropType = {
      x: [newTime - scrollableAreaTime / 2, newTime + scrollableAreaTime / 2], // half on either side
      y: yDomain,
    }
    log.scrollEvent('TimelineScroll onScroll domain', domain);
    this.setZoomDomainWhileScrolling(domain);
  }

  onScrollBeginDrag(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const {
      setTimelineScrolling,
    } = this.props;
    this.clearTimer();
    this._scrolling = true;
    log.scrollEvent('onScrollBeginDrag');
    setTimelineScrolling(true);
  }

  onScrollEndDrag(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { yDomain } = constants.timeline;
    const {
      visibleTime,
    } = this.props;
    const scrollableAreaTime = visibleTime * constants.timeline.widthMultiplier;
    const {
      centerTime,
      scrollableWidth,
      scrollToX,
    } = this.props;
    log.scrollEvent('onScrollEndDrag');
    this.clearTimer();
    const { x } = event.nativeEvent.contentOffset;
    const movedX = x - scrollToX;
    const timeDelta = (movedX / scrollableWidth) * scrollableAreaTime;
    const rightNow = utils.now();
    const newTime = Math.min(rightNow, centerTime + timeDelta);
    const domain: DomainPropType = {
      x: [newTime - scrollableAreaTime / 2, newTime + scrollableAreaTime / 2], // half on either side
      y: yDomain,
    }
    log.scrollEvent('TimelineScroll onScrollEndDrag domain', domain);
    this.setZoomDomainWhileScrolling(domain); // note onFinishScrolling until after _timer in case of momentum scroll
    this._timer = setTimeout(() => {
      log.scrollEvent('TimelineScroll onScrollEndDrag timer fired:', domain);
      this.onFinishScrolling(domain);
      this._timer = undefined;
    }, constants.timing.scrollViewWaitForMomentumScroll)
  }

  render() {
    utils.addToCount('renderTimelineScroll');
    const {
      decelerationRate,
      pinchZoom,
      register,
      scrollToX,
      timelineZoomValue,
    } = this.props;
    const opacity = 1;
    const pointerEvents = 'auto';
    return (
      <ScrollView
        centerContent={false}
        contentOffset={{ x: scrollToX, y: 0 }}
        horizontal={true}
        decelerationRate={decelerationRate}
        disableIntervalMomentum={true}
        onContentSizeChange={this.onContentSizeChange}
        onMomentumScrollBegin={this.onMomentumScrollBegin}
        onMomentumScrollEnd={this.onMomentumScrollEnd}
        onScroll={this.onScroll}
        onScrollBeginDrag={this.onScrollBeginDrag}
        onScrollEndDrag={this.onScrollEndDrag}
        overScrollMode='never'
        pinchGestureEnabled={pinchZoom}
        pointerEvents={pointerEvents}
        ref={(_scrollView: ScrollView) => {
          this._scrollView = _scrollView;
          register(this);
        }}
        scrollEventThrottle={16 /* msec >= 16. default 0 means event sent only once each time view is scrolled. */}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={[TimelineStyles.scrollView, { opacity }]}
        zoomScale={pinchZoom ? timelineZoomValue : 1}
      >
        <TimelineContainer />
      </ScrollView>
    )
  }

  scrollToTime(scrollTime: number) {
    log.scrollEvent('TimelineScroll scrollToTime', scrollTime, utils.displayTimestamp(scrollTime));
    if (this._scrollView) {
      const {
        centerTime,
        scrollableWidth,
        visibleWidth,
        visibleTime
      } = this.props;
      const scrollToX = (visibleWidth * ((scrollTime - centerTime) / visibleTime))
        + (scrollableWidth / 2) - (visibleWidth / 2);
      const options = {
        x: scrollToX,
        animated: false,
      }
      log.scrollEvent(`scrollToTime centerTime ${centerTime} scrollTime ${scrollTime} visibleTime ${visibleTime} visibleWidth ${visibleWidth} scrollToX ${scrollToX}`);
      this._scrollView.scrollTo(options);
    }
  }
}

export default TimelineScroll;
