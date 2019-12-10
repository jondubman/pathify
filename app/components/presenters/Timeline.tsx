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
import { TimelineProps } from 'containers/TimelineContainer';
import TimelineSpansContainer from 'containers/TimelineSpansContainer';
import TimelineMarksContainer from 'containers/TimelineMarksContainer';
import timeseries, { interval } from 'shared/timeseries';

const initialState = {
}
type State = Readonly<typeof initialState>

const TimelineStyles = StyleSheet.create({
  timeline: {
    backgroundColor: constants.colors.timeline.background,
    height: constants.timeline.default.height,
    opacity: 1,
  },
})

class Timeline extends Component<TimelineProps> {

  readonly state: State = initialState;

  constructor(props: any) {
    super(props);
    this.handleZoom = this.handleZoom.bind(this);
  }

  // This responds to user zoom interaction (which won't be happening if allowZoom is false)
  handleZoom(domain: DomainPropType, props: any) {
  }

  render() {
    const {
      allowZoom,
      showMarks,
      showSpans,
      viewTime,
      timelineWidth,
      zoomDomain,
      zoomLevel,
    } = this.props;

    const zoomInfo = constants.timeline.zoomLevels[zoomLevel];
    const { tickInterval, tickFormat } = zoomInfo;
    const tickFormatFn = (t: Date) => {
      // TODO could customize string here to highlight special times/dates, e.g. 'noon'
      return d3.timeFormat(tickFormat)(t);
    }
    let timeRoundDown: number;
    if (tickInterval >= interval.day) {
      timeRoundDown = timeseries.timeRoundDown(timeseries.timeRoundDownToMidnight(viewTime), interval.hours(1))
    } else if (tickInterval >= interval.hours(12)) {
      timeRoundDown = timeseries.timeRoundDown(timeseries.timeRoundDownHours(viewTime), interval.hours(1))
    } else {
      timeRoundDown = timeseries.timeRoundDown(viewTime, tickInterval);
    }
    const tickValues: number[] = [];
    const maxTicksPerScreenWidth = 12 * constants.timeline.widthMultiplier; // 12 is not magic per se, just about right.
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
              allowPan={false}
              allowZoom={allowZoom}
              minimumZoom={{ x: constants.timeline.minimumZoomMsec, y: 1 }}
              responsive={false}
              width={timelineWidth}
              zoomDimension="x"
              zoomDomain={zoomDomain}
              onZoomDomainChange={this.handleZoom}
            />
          }
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
            <TimelineSpansContainer  />
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
