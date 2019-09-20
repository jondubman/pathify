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
    opacity: 0.75,
    position: 'absolute',
    bottom: 0,
  },
})

class TimelineScroll extends Component<TimelineScrollProps> {

  public readonly state: State = initialState;
  public _lastDomain: DomainPropType | undefined;
  public _refTime: number | undefined;
  public _scrollView: any;
  public _scrolling: boolean = false;
  public _timer: any;

  constructor(props: any) {
    super(props);
  }

  public shouldComponentUpdate(nextProps: TimelineScrollProps, nextState: any) {
    if (this._scrolling) {
      return false; // TODO2 defer all updates to the timeline while it is being interactively scrolled
    }
    return true;
  }

  // Auto-scroll to the midpoint of the scrollable area when component is updated.
  public componentDidUpdate() {
    const x = this.props.scrollToX;
    this._scrollView.scrollTo({ x, y: 0, animated: false });
  }

  public componentWillUnmount() {
    this.props.setTimelineScrolling(false);
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = undefined;
    }
  }

  public render() {
    const {
      now,
      refTime,
      scrollableWidth,
      scrollToX,
      setTimelineScrolling,
      setTimelineNow,
      timelineRefTime,
      visibleTime,
      zoomDomainChanged,
      zoomDomainChanging,
    } = this.props;

    const { yDomain } = constants.timeline;
    const scrollableAreaTime = visibleTime * constants.timeline.widthMultiplier;
    const logScrollEvents = true;

    // TODO2 consolidate shared code here

    const setZoomDomainWhileScrolling = (domain: any) => { // TODO
      zoomDomainChanging(domain);
    }

    const onContentSizeChange = (contentWidth, contentHeight) => {
      log.debug('onContentSizeChange', contentWidth, contentHeight);
    }

    const onMomentumScrollBegin = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      this._scrolling = true;
      logScrollEvents && log.trace('onMomentumScrollBegin');
      setTimelineScrolling(true);
      if (this._timer) { // The timer was only around to finish scrolling in case we are not momentum scrolling.
        clearTimeout(this._timer);
        this._timer = undefined;
      }
    }

    const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      logScrollEvents && log.trace('onMomentumScrollEnd');
      const { x } = event.nativeEvent.contentOffset;
      const movedX = x - scrollToX;
      const timeDelta = (movedX / scrollableWidth) * scrollableAreaTime;
      const newTime = Math.min(timelineRefTime + timeDelta, now);
      this._refTime = newTime;
      const domain: DomainPropType = {
        x: [newTime - scrollableAreaTime / 2, newTime + scrollableAreaTime / 2], // half on either side
        y: yDomain,
      }
      onFinishScrolling(domain);
      logScrollEvents && log.trace('onMomentumScrollEnd', newTime, now, newTime - now);
    }

    const onScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      logScrollEvents && log.trace('onScrollEndDrag');
      const { x } = event.nativeEvent.contentOffset;
      const movedX = x - scrollToX;
      const timeDelta = (movedX / scrollableWidth) * scrollableAreaTime;
      const newTime = Math.min(timelineRefTime + timeDelta, now);
      const domain: DomainPropType = {
        x: [newTime - scrollableAreaTime / 2, newTime + scrollableAreaTime / 2], // half on either side
        y: yDomain,
      }
      log.debug('domain', domain);
      setZoomDomainWhileScrolling(domain); // note onFinishScrolling until after _timer in case of momentum scroll
      this._timer = setTimeout(() => {
        if (this._scrolling) {
          onFinishScrolling(domain);
        }
      }, constants.timing.scrollViewWaitForMomentumScroll)
    }

    const onScrolling = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!this._scrolling) {
        logScrollEvents && log.trace('onScrolling called when not scrolling - ignoring');
        return;
      }
      logScrollEvents && log.trace('onScrolling', timelineRefTime, refTime, this._refTime);
      const { x } = event.nativeEvent.contentOffset;
      const movedX = x - scrollToX;
      const timeDelta = (movedX / scrollableWidth) * scrollableAreaTime;
      if (logScrollEvents) {
        log.debug('movedX', movedX, 'scrollableAreaTime', Math.round(scrollableAreaTime) / 60000, 'scrollableWidth',
          Math.round(scrollableWidth), 'timeDelta', Math.round(timeDelta) / 60000);
      }
      const newTime = Math.min(timelineRefTime + timeDelta, now);
      setTimelineNow(newTime >= utils.now() - constants.timing.timelineCloseToNow); // TODO3
      const domain: DomainPropType = {
        x: [newTime - scrollableAreaTime / 2, newTime + scrollableAreaTime / 2], // half on either side
        y: yDomain,
      }
      logScrollEvents && log.debug('domain', domain);
      setZoomDomainWhileScrolling(domain);
      this._refTime = newTime;
    }

    const onScrollStart = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (this._timer) {
        clearTimeout(this._timer);
        this._timer = undefined;
      }
      this._scrolling = true;
      this._refTime = this.props.refTime;
      logScrollEvents && log.trace('onScrollStart');
      setTimelineScrolling(true);
    }

    const onFinishScrolling = (domain: DomainPropType) => {
      if (this._timer) {
        clearTimeout(this._timer);
        this._timer = undefined;
      }
      this._scrolling = false;
      logScrollEvents && log.trace('onFinishScrolling', domain);
      const x = (domain as any).x as [number, number];
      const newTime = (x[0] + x[1]) / 2;
      setTimelineNow(newTime >= utils.now() - constants.timing.timelineCloseToNow); // TODO3
      setTimelineScrolling(false);
      zoomDomainChanged(domain);
    }

    return (
      <ScrollView
        centerContent={true}
        contentOffset={{ x: this.props.scrollToX, y: 0 }}
        horizontal={true}
        decelerationRate={1.0 /* TODO this has no effect */}
        onContentSizeChange={onContentSizeChange}
        onMomentumScrollBegin={onMomentumScrollBegin}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScroll={onScrolling}
        onScrollBeginDrag={onScrollStart}
        onScrollEndDrag={onScrollEndDrag}
        overScrollMode='never'
        pinchGestureEnabled={false}
        ref={_scrollView => { this._scrollView = _scrollView }}
        scrollEventThrottle={20 /* msec >= 16 */}
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
