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

import constants from 'lib/constants';
import { TimelinePanelProps } from 'containers/TimelineContainer';
import TimelineMarks from 'presenters/TimelineMarks';
import TimelineSpans from 'presenters/TimelineSpans';
import log from 'shared/log';
import timeseries, { interval } from 'shared/timeseries';

const initialState = {
  zoomDomain: null as any,
}
type State = Readonly<typeof initialState>

const TimelineStyles = StyleSheet.create({
  timeline: {
    backgroundColor: constants.colors.timeline.background,
    height: constants.timeline.default.height,
    opacity: 1,
  },
})

class Timeline extends Component<TimelinePanelProps> {

  public readonly state: State = initialState;
  // public renderCount: number = 0;

  constructor(props: any) {
    super(props);
    this.handleZoom = this.handleZoom.bind(this);
  }

  // This responds to user zoom interaction (which won't be happening if allowZoom is false)
  public handleZoom(domain: DomainPropType, props: any) {
    // this.setState({ zoomDomain: domain }, () => {
    //   this.props.zoomDomainChanged(domain);
    // })
  }

  public render() {
    const {
      allowZoom,
      currentActivity,
      marks,
      nowTime,
      refTime,
      selectedActivity,
      showMarks,
      showSpans,
      startupTime,
      timeRange,
      timespans,
      timelineWidth,
      visibleTime,
      zoomLevel,
    } = this.props;

    const { yDomain } = constants.timeline;
    const zoomInfo = constants.timeline.zoomLevels[zoomLevel];
    const { tickInterval, tickFormat } = zoomInfo;
    // TODO the following # of days is currently arbitrary, belongs in constants if anywhere
    const someTimeAgo = timeseries.timeRoundDown(startupTime - interval.days(60), interval.days(1));
    const tickFormatFn = (t: Date) => {
      // TODO could customize string here to highlight special times/dates, e.g. 'noon'
      return d3.timeFormat(tickFormat)(t);
    }
    const scrollableAreaTime = visibleTime * constants.timeline.widthMultiplier;
    const dataDomain: DomainPropType = { // the entire navigable domain of the Timeline
      x: [Math.min(timeRange[0], someTimeAgo), Math.max(timeRange[1], nowTime + scrollableAreaTime / 2)],
      y: yDomain,
    }
    const zoomDomain: DomainPropType = { // the visible domain of the Timeline
      x: [refTime - scrollableAreaTime / 2, refTime + scrollableAreaTime / 2], // half goes on either side of refTime
      y: yDomain,
    }
    let timeRoundDown: number;
    if (tickInterval >= interval.day) {
      timeRoundDown = timeseries.timeRoundDown(timeseries.timeRoundDownToMidnight(refTime), interval.hours(1))
    } else if (tickInterval >= interval.hours(12)) {
      timeRoundDown = timeseries.timeRoundDown(timeseries.timeRoundDownHours(refTime), interval.hours(1))
    } else {
      timeRoundDown = timeseries.timeRoundDown(refTime, tickInterval);
    }
    const tickValues: number[] = [];
    const maxTicksPerScreenWidth = 12 * constants.timeline.widthMultiplier; // approx
    for (let i = -maxTicksPerScreenWidth / 2; i < maxTicksPerScreenWidth / 2; i++) {
       // Any outside the visible range will be clipped.
      tickValues.push(timeRoundDown + tickInterval * i);
    }
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
    // Note allowZoom is false; direct zooming (with pinch-to-zoom) by the user is currently disabled, as it's too easy
    // to engage accidentally, which can be disorienting. With allowZoom false, onZoomDomainChange will not be called.
    // Zoom is still allowed, indirectly, via constants.timeline.zoomLevels.

    // TODO
    // animate={{ duration: 0, onExit: { duration: 0 }, onEnter: { duration: 0 }, onLoad: { duration: 0 }}}

    return (
      <View style={TimelineStyles.timeline}>
        <VictoryChart
          containerComponent={
            <VictoryZoomContainer
              allowPan={false /* TODO was true */}
              allowZoom={allowZoom}
              minimumZoom={{ x: 1000, y: 1 }}
              responsive={false}
              width={timelineWidth}
              zoomDimension="x"
              zoomDomain={zoomDomain}
              onZoomDomainChange={this.handleZoom}
            /> as any
          }
          domain={dataDomain}
          height={constants.timeline.default.height}
          width={timelineWidth}
          padding={{ bottom: constants.timeline.bottomPaddingForAxis, left: 0, right: 0, top: 0 }}
        >
          <VictoryAxis
            style={axisStyle}
            tickLabelComponent={<VictoryLabel style={axisLabelStyle}/> as any}
            tickFormat={tickFormatFn}
            tickValues={tickValues}
          />
          {showSpans ?
            <TimelineSpans data={timespans} />
            : null}
          {showMarks ?
            <TimelineMarks data={marks} currentActivity={currentActivity} selectedActivity={selectedActivity} />
            : null }
        </VictoryChart>
      </View>
    )
  }
}

export default Timeline;
