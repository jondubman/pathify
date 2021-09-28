// This is the core of the Timeline, which is based on VictoryChart.
import * as d3 from 'd3';

import React, {
  Component,
} from 'react';

import {
  StyleSheet,
  View,
} from 'react-native';

import {
  DomainPropType,
  VictoryAxis,
  VictoryChart,
  VictoryLabel,
  VictoryZoomContainer,
} from 'victory-native';

import { TimelineProps } from 'containers/TimelineContainer';
import TimelineFutureSpanContainer from 'containers/TimelineFutureSpanContainer';
import ActivityTimespansContainer from 'containers/ActivityTimespansContainer';
import TimelineMarksContainer from 'containers/TimelineMarksContainer';
import constants from 'lib/constants';
import { timelineHeightIfShowing } from 'lib/selectors';
import utils from 'lib/utils';
import timeseries, { interval } from 'lib/timeseries';

const initialState = {
}
type State = Readonly<typeof initialState>

const TimelineStyles = StyleSheet.create({
  timeline: {
    backgroundColor: constants.colors.timeline.background,
    height: timelineHeightIfShowing(),
    opacity: 1,
  },
})

const axisStyle = {
  axis: { stroke: constants.colors.timeline.axis },
  grid: { stroke: (t: Date) => constants.colors.timeline.axis } as any,
  // ticks: { stroke: 'gray', size: 5 }, // appears below axis, not needed
  tickLabels: {
    fontSize: constants.timeline.tickLabelFontSize,
    padding: 0,
    stroke: constants.colors.timeline.axis
  },
}
const axisLabelStyle = {
  fontFamily: constants.fonts.family,
  fontSize: 10,
  letterSpacing: 'normal',
  padding: 0,
  fill: constants.colors.timeline.axisLabels,
  style: { strokeWidth: 0 },
}

const getTickFormatFn = (tickFormat: string) => (
  // TODO could customize string here to highlight special times/dates, e.g. 'noon'
  (t: Date) => (
    d3.timeFormat(tickFormat)(t)
  )
)

class Timeline extends Component<TimelineProps> {

  readonly state: State = initialState;

  constructor(props: any) {
    super(props);
    this.handleZoom = this.handleZoom.bind(this);
    this.axisTickValues = this.axisTickValues.bind(this);
  }

  // This responds to user zoom interaction (which won't be happening if allowZoom is false)
  handleZoom(domain: DomainPropType, props: any) {
  }

  axisTickValues(): number[] {
    const {
      centerTime,
      zoomLevel,
    } = this.props;
    const zoomInfo = constants.timeline.zoomRanges[zoomLevel];
    const { tickInterval } = zoomInfo;
    let timeRoundDown: number;
    if (tickInterval >= interval.day) {
      timeRoundDown = timeseries.timeRoundDown(timeseries.timeRoundDownToMidnight(centerTime), interval.hours(1))
    } else if (tickInterval >= interval.hours(12)) {
      timeRoundDown = timeseries.timeRoundDown(timeseries.timeRoundDownHours(centerTime), interval.hours(1))
    } else {
      timeRoundDown = timeseries.timeRoundDown(centerTime, tickInterval);
    }
    const tickValues: number[] = [];
    const maxTicksPerScreenWidth = 12 * constants.timeline.widthMultiplier; // 12 is not magic per se, just about right.
    for (let i = -maxTicksPerScreenWidth / 2; i < maxTicksPerScreenWidth / 2; i++) {
      // Any outside the visible range will be clipped.
      tickValues.push(timeRoundDown + tickInterval * i);
    }
    return tickValues;
  }

  render() {
    utils.addToCount('renderTimeline');
    const {
      pinchZoom,
      showFutureTimespan,
      showMarks,
      showSpans,
      timelineWidth,
      zoomDomain,
      zoomLevel,
    } = this.props;
    const zoomInfo = constants.timeline.zoomRanges[zoomLevel];
    const { tickFormat } = zoomInfo;
    const tickFormatFn = getTickFormatFn(tickFormat);
    const tickValues = this.axisTickValues();
    // Note allowZoom is false; direct zooming (with pinch-to-zoom) by the user is currently disabled, as it's too easy
    // to engage accidentally, which can be disorienting. With allowZoom false, onZoomDomainChange will not be called.
    // Zoom is still allowed, indirectly, via constants.timeline.zoomRanges.
    //
    // TODO use this in the future?
    // animate={{ duration: 0, onExit: { duration: 0 }, onEnter: { duration: 0 }, onLoad: { duration: 0 }}}
    return (
      <View style={TimelineStyles.timeline}>
        <VictoryChart
          containerComponent={
            <VictoryZoomContainer
              allowPan={false}
              allowZoom={pinchZoom}
              minimumZoom={{ x: constants.timeline.minimumZoomMsec, y: 1 }}
              responsive={false}
              width={timelineWidth}
              zoomDimension="x"
              zoomDomain={zoomDomain}
              onZoomDomainChange={this.handleZoom}
            />
          }
          height={timelineHeightIfShowing()}
          width={timelineWidth}
          padding={{ bottom: utils.bottomPaddingForAxis(), left: 0, right: 0, top: 0 }}
        >
          <VictoryAxis
            style={axisStyle}
            tickLabelComponent={<VictoryLabel style={axisLabelStyle}/> as any}
            tickFormat={tickFormatFn}
            tickValues={tickValues}
          />
          {showSpans ?
            <ActivityTimespansContainer />
            : null}
          {showSpans && showFutureTimespan ?
            <TimelineFutureSpanContainer />
            : null}
          {showMarks ?
            <TimelineMarksContainer />
            : null }
        </VictoryChart>
      </View>
    )
  }
}

export default Timeline;
