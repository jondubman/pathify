import React, {
  Component,
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
import utils from 'lib/utils';
import log from 'shared/log';
const logScrollEvents = false;

const initialState = {
  zoomDomain: null as any,
}
type State = Readonly<typeof initialState>

const TimelineStyles = StyleSheet.create({
  scrollView: {
    backgroundColor: 'transparent',
    opacity: 1,
    position: 'absolute',
    bottom: 0,
  },
})

class TimelineScroll extends Component<TimelineScrollProps> {

  readonly state: State = initialState;
  _scrollView: any;
  _scrolling: boolean = false;
  _timer: any;

  constructor(props: any) {
    super(props);
    this.clearTimer = this.clearTimer.bind(this);
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

  shouldComponentUpdate(nextProps: TimelineScrollProps, nextState: any) {
    if (this._scrolling) {
      return false; // defer all updates to the timeline while it is being interactively scrolled
    }
    // if (nextProps.scrollToX !== this.props.scrollToX) {
    // }
    if (nextProps.centerTime !== this.props.centerTime) {
      return true;
    }
    if (nextProps.visibleTime !== this.props.visibleTime) {
      return true;
    }
    return false;
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
      const x = this.props.scrollToX;
      this._scrollView.scrollTo({ x, y: 0, animated: false });
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
    logScrollEvents && log.trace('onFinishScrolling', domain);
    const x = (domain as any).x as [number, number];
    const newTime = Math.min(utils.now(), (x[0] + x[1]) / 2);
    const rightNow = utils.now();
    setTimelineNow(newTime >= rightNow - constants.timing.timelineCloseToNow);
    setTimelineScrolling(false);
    zoomDomainChanged(domain);
  }

   onMomentumScrollBegin(event: NativeSyntheticEvent<NativeScrollEvent>) {
    this._scrolling = true;
    // The timer was only around to finish scrolling in case we are not momentum scrolling.
    this.clearTimer();
    logScrollEvents && log.trace('onMomentumScrollBegin');
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
    logScrollEvents && log.trace('onMomentumScrollEnd', newTime, rightNow, newTime - rightNow);
    this.onFinishScrolling(domain);
  }

  onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { yDomain } = constants.timeline;
    const {
      centerTime,
      scrollableWidth,
      scrollToX,
      visibleTime,
    } = this.props;
    const scrollableAreaTime = visibleTime * constants.timeline.widthMultiplier;
    logScrollEvents && log.trace('onScroll', centerTime);
    const { x } = event.nativeEvent.contentOffset;
    const movedX = x - scrollToX;
    const timeDelta = (movedX / scrollableWidth) * scrollableAreaTime;
    if (logScrollEvents) {
      log.debug('movedX', movedX, 'scrollableAreaTime', Math.round(scrollableAreaTime) / 60000, 'scrollableWidth',
        Math.round(scrollableWidth), 'timeDelta', Math.round(timeDelta) / 60000);
    }
    const rightNow = utils.now();
    const newTime = Math.min(rightNow, centerTime + timeDelta);
    const domain: DomainPropType = {
      x: [newTime - scrollableAreaTime / 2, newTime + scrollableAreaTime / 2], // half on either side
      y: yDomain,
    }
    logScrollEvents && log.debug('domain', domain);
    if (!this._scrolling) {
      logScrollEvents && log.trace('onScroll called when not scrolling - avoiding setZoomDomainWhileScrolling');
      return;
    }
    this.setZoomDomainWhileScrolling(domain);
  }

  onScrollBeginDrag(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const {
      setTimelineScrolling,
    } = this.props;
    this.clearTimer();
    this._scrolling = true;
    logScrollEvents && log.trace('onScrollBeginDrag');
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
    logScrollEvents && log.trace('onScrollEndDrag');
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
    log.debug('domain', domain);
    this.setZoomDomainWhileScrolling(domain); // note onFinishScrolling until after _timer in case of momentum scroll
    this._timer = setTimeout(() => {
      log.trace('timer!', domain);
      this.onFinishScrolling(domain);
      this._timer = undefined;
    }, constants.timing.scrollViewWaitForMomentumScroll)
  }

  render() {
    utils.addToCount('renderTimelineScroll');
    const {
      decelerationRate,
    } = this.props;
    return (
      <ScrollView
        centerContent={false}
        contentOffset={{ x: this.props.scrollToX, y: 0 }}
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
        pinchGestureEnabled={false}
        ref={_scrollView => { this._scrollView = _scrollView }}
        scrollEventThrottle={16 /* msec >= 16. default 0 means event sent only once each time view is scrolled. */}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={TimelineStyles.scrollView}
        zoomScale={1}
      >
        <TimelineContainer />
      </ScrollView>
    )
  }
}

export default TimelineScroll;
