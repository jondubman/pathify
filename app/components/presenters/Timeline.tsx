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
import log from 'lib/log';
import { TimelinePanelProps } from 'containers/TimelineContainer';
import TimelineSpans from 'presenters/TimelineSpans';
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
  // TODO review panning of the timeline
  public handleZoom(domain: DomainPropType, props: any) {
    this.setState({ zoomDomain: domain }, () => {
      this.props.zoomDomainChanged(domain);
    })
  }

  public render() {
    const { nowTime, refTime, timeRange, timespans, zoomLevel } = this.props;
    const { startupTime } = constants;
    const { yDomain } = constants.timeline;
    const zoomInfo = constants.timeline.zoomLevels[zoomLevel];
    const { tickInterval, tickFormat, visibleTime } = zoomInfo;

    const someTimeAgo = timeseries.timeRoundDown(startupTime - interval.days(60), interval.days(1));
    const tickFormatFn = (t: Date) => {
      return d3.timeFormat(tickFormat)(t);
    }
    const dataDomain: DomainPropType = { // the entire navigable domain of the Timeline
      x: [Math.min(timeRange[0], someTimeAgo), Math.max(timeRange[1], nowTime + visibleTime / 2)],
      y: yDomain,
    }
    const zoomDomain: DomainPropType = { // the visible domain of the Timeline
      x: [refTime - visibleTime / 2, refTime + visibleTime / 2], // half the visible time goes on either side of refTime
      y: yDomain,
    }

    // const timeRoundDown = (tickInterval >= interval.hours(12)) ?
    //   timeseries.timeRoundDown(timeseries.timeRoundDownHours(refTime), interval.hours(1))
    //   :
    //   timeseries.timeRoundDown(refTime, tickInterval);

    let timeRoundDown: number;
    if (tickInterval >= interval.day) {
      timeRoundDown = timeseries.timeRoundDown(timeseries.timeRoundDownToMidnight(refTime), interval.hours(1))
    } else if (tickInterval >= interval.hours(12)) {
      timeRoundDown = timeseries.timeRoundDown(timeseries.timeRoundDownHours(refTime), interval.hours(1))
    } else {
      timeRoundDown = timeseries.timeRoundDown(refTime, tickInterval);
    }

    const tickValues = [ // Any outside the visible range will be clipped. count is 10.
      timeRoundDown - tickInterval * 4,
      timeRoundDown - tickInterval * 3,
      timeRoundDown - tickInterval * 2,
      timeRoundDown - tickInterval,
      timeRoundDown,
      timeRoundDown + tickInterval,
      timeRoundDown + tickInterval * 2,
      timeRoundDown + tickInterval * 3,
      timeRoundDown + tickInterval * 4,
      timeRoundDown + tickInterval * 5,
    ]
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
      fontFamily: 'Futura',
      fontSize: 10,
      letterSpacing: 'normal',
      padding: 0,
      fill: constants.colors.timeline.axisLabels,
      style: { strokeWidth: 0 },
    }
    // Note allowZoom is false; direct zooming (with pinch-to-zoom) by the user is currently disabled, as it's too easy
    // to engage accidentally, which can be disorienting. With allowZoom false, onZoomDomainChange will not be called.
    // Zoom is still allowed, indirectly, via constants.timeline.zoomLevels.
    return (
      <View style={TimelineStyles.timeline}>
        <VictoryChart
          containerComponent={
            <VictoryZoomContainer
              allowPan={true}
              allowZoom={false}
              minimumZoom={{ x: 1000, y: 1 }}
              responsive={true}
              zoomDimension="x"
              zoomDomain={zoomDomain}
              onZoomDomainChange={this.handleZoom}
            /> as any
          }
          domain={dataDomain}
          height={constants.timeline.default.height}
          padding={{ bottom: constants.timeline.bottomPaddingForAxis, left: 0, right: 0, top: 0 }}
        >
          <VictoryAxis
            style={axisStyle}
            tickLabelComponent={<VictoryLabel style={axisLabelStyle}/> as any}
            tickFormat={tickFormatFn}
            tickValues={tickValues}
          />
          <TimelineSpans
            data={timespans}
            ref={(timespans: any) => (this as any)._timespans = timespans}
          />
        </VictoryChart>
      </View>
    )
  }
}

export default Timeline;
