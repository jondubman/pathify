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
    if (nextProps.viewTime !== this.props.viewTime) {
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

  render() {
    const {
      decelerationRate,
      scrollableWidth,
      scrollTime,
      scrollToX,
      setTimelineScrolling,
      setTimelineNow,
      viewTime,
      visibleTime,
      zoomDomainChanged,
      zoomDomainChanging,
    } = this.props;

    const { yDomain } = constants.timeline;
    const scrollableAreaTime = visibleTime * constants.timeline.widthMultiplier;
    const logScrollEvents = true;

    const setZoomDomainWhileScrolling = (domain: DomainPropType) => {
      log.trace('setZoomDomainWhileScrolling', domain);
      zoomDomainChanging(domain);
    }

    const onContentSizeChange = (contentWidth, contentHeight) => {
      log.debug('onContentSizeChange', contentWidth, contentHeight);
    }

    const onFinishScrolling = (domain: DomainPropType) => {
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

    const onMomentumScrollBegin = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      this._scrolling = true;
      logScrollEvents && log.trace('onMomentumScrollBegin');
      setTimelineScrolling(true);
      // The timer was only around to finish scrolling in case we are not momentum scrolling.
      this.clearTimer();
    }

    const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { x } = event.nativeEvent.contentOffset;
      const movedX = x - scrollToX;
      const timeDelta = (movedX / scrollableWidth) * scrollableAreaTime;
      const rightNow = utils.now();
      const newTime = Math.min(rightNow, scrollTime + timeDelta);
      const domain: DomainPropType = {
        x: [newTime - scrollableAreaTime / 2, newTime + scrollableAreaTime / 2], // half on either side
        y: yDomain,
      }
      logScrollEvents && log.trace('onMomentumScrollEnd', newTime, rightNow, newTime - rightNow);
      onFinishScrolling(domain);
    }

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      logScrollEvents && log.trace('onScroll', viewTime, scrollTime);
      const { x } = event.nativeEvent.contentOffset;
      const movedX = x - scrollToX;
      const timeDelta = (movedX / scrollableWidth) * scrollableAreaTime;
      if (logScrollEvents) {
        log.debug('movedX', movedX, 'scrollableAreaTime', Math.round(scrollableAreaTime) / 60000, 'scrollableWidth',
          Math.round(scrollableWidth), 'timeDelta', Math.round(timeDelta) / 60000);
      }
      const rightNow = utils.now();
      const newTime = Math.min(rightNow, scrollTime + timeDelta);
      const domain: DomainPropType = {
        x: [newTime - scrollableAreaTime / 2, newTime + scrollableAreaTime / 2], // half on either side
        y: yDomain,
      }
      logScrollEvents && log.debug('domain', domain);
      if (!this._scrolling) {
        logScrollEvents && log.trace('onScroll called when not scrolling - avoiding setZoomDomainWhileScrolling');
        return;
      }
      setZoomDomainWhileScrolling(domain);
    }

    const onScrollBeginDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      this.clearTimer();
      this._scrolling = true;
      logScrollEvents && log.trace('onScrollBeginDrag');
      setTimelineScrolling(true);
    }

    const onScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      logScrollEvents && log.trace('onScrollEndDrag');
      this.clearTimer();
      const { x } = event.nativeEvent.contentOffset;
      const movedX = x - scrollToX;
      const timeDelta = (movedX / scrollableWidth) * scrollableAreaTime;
      const rightNow = utils.now();
      const newTime = Math.min(rightNow, scrollTime + timeDelta); // TODO should this be viewTime?
      const domain: DomainPropType = {
        x: [newTime - scrollableAreaTime / 2, newTime + scrollableAreaTime / 2], // half on either side
        y: yDomain,
      }
      log.debug('domain', domain);
      setZoomDomainWhileScrolling(domain); // note onFinishScrolling until after _timer in case of momentum scroll
      this._timer = setTimeout(() => {
        log.trace('timer!', domain);
        // if (this._scrolling) {
          onFinishScrolling(domain);
        // }
        this._timer = undefined;
      }, constants.timing.scrollViewWaitForMomentumScroll)
    }

    return (
      <ScrollView
        centerContent={false}
        contentOffset={{ x: this.props.scrollToX, y: 0 }}
        horizontal={true}
        decelerationRate={decelerationRate}
        disableIntervalMomentum={true}
        onContentSizeChange={onContentSizeChange}
        onMomentumScrollBegin={onMomentumScrollBegin}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
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
