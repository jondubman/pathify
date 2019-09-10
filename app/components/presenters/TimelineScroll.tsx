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

import constants from 'lib/constants';
import utils from 'lib/utils';
import TimelineContainer from 'containers/TimelineContainer';
import { TimelineScrollProps } from 'containers/TimelineScrollContainer';

const initialState = {
  zoomDomain: null as any,
}
type State = Readonly<typeof initialState>

const TimelineStyles = StyleSheet.create({
  scrollView: {
    backgroundColor: constants.colors.byName.purple, // TODO
    opacity: 0.75,
    position: 'absolute', // TODO why is layout borked without this?
    bottom: 0,
  },
})

class TimelineScroll extends Component<TimelineScrollProps> {

  public readonly state: State = initialState;
  // public renderCount: number = 0;
  public _scrollView: any;

  constructor(props: any) {
    super(props);
  }

  // Auto-scroll to the midpoint of the scrollable area when component is updated.
  public componentDidUpdate() {
    const x = this.props.scrollToX;
    this._scrollView.scrollTo({ x, y: 0, animated: false });
  }

  public render() {
    const {
      scrollableWidth,
      scrollToX,
      timelineRefTime,
      visibleTime,
    } = this.props;

    const { yDomain } = constants.timeline;
    const scrollableAreaTime = visibleTime * constants.timeline.widthMultiplier;

    const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { x } = event.nativeEvent.contentOffset;
      const movedX = x - scrollToX;
      const timeDelta = (movedX * scrollableAreaTime) / scrollableWidth;
      const newTime = Math.min(timelineRefTime + timeDelta, utils.now());
      const domain: DomainPropType = {
        x: [newTime - scrollableAreaTime / 2, newTime + scrollableAreaTime / 2], // half goes on either side of refTime
        y: yDomain,
      }
      this.props.zoomDomainChanged(domain);
    }

    const onScrolling = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { x } = event.nativeEvent.contentOffset;
      const movedX = x - scrollToX;
      const timeDelta = (movedX * scrollableAreaTime) / scrollableWidth;
      const newTime = Math.min(timelineRefTime + timeDelta, utils.now());
      const domain: DomainPropType = {
        x: [newTime - scrollableAreaTime / 2, newTime + scrollableAreaTime / 2], // half goes on either side of refTime
        y: yDomain,
      }
      this.props.zoomDomainChanging(domain);
    }

    return (
      <ScrollView
        centerContent={true}
        contentOffset={{ x: this.props.scrollToX, y: 0 }}
        horizontal={true}
        onMomentumScrollEnd={onScrollEnd}
        onScroll={onScrolling}
        ref={_scrollView => { this._scrollView = _scrollView }}
        scrollEventThrottle={50 /* msec >= 16 */ }
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={TimelineStyles.scrollView}
      >
        <TimelineContainer />
      </ScrollView>
    )
  }
}

export default TimelineScroll;
