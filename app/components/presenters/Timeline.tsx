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
import TimelineSpans from 'presenters/TimelineSpans';

const initialState = {
  zoomDomain: null as any,
}
type State = Readonly<typeof initialState>

const tickFormat = (t: Date) => {
  // TODO improve, and use multi-format
  // https://github.com/d3/d3-time-format/blob/master/README.md#timeFormat
  return d3.timeFormat('%-I:%M:%S')(t);
}

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
    const { refTime, timeRange, timespans, zoomLevel } = this.props;
    const { yDomain } = constants.timeline;
    const visibleTime = constants.timeline.visibleTimeForZoomLevel[zoomLevel];

    const dataDomain: DomainPropType = { // the entire navigable domain of the Timeline
      x: [timeRange[0], Math.max(timeRange[1], refTime + visibleTime / 2)],
      y: yDomain,
    }

    const zoomDomain: DomainPropType = { // the visible domain of the Timeline
      x: [refTime - visibleTime / 2, refTime + visibleTime / 2], // half the visible time goes on either side of refTime
      y: yDomain,
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
      fontFamily: 'Futura',
      fontSize: 10,
      letterSpacing: 'normal',
      padding: 0,
      fill: constants.colors.timeline.axisLabels,
      style: { strokeWidth: 0 },
    }
    // Note allowZoom is false; direct zooming (with pinch-to-zoom) by the user is currently disabled, as it's too easy
    // to engage accidentally, which can be disorienting. With allowZoom false, onZoomDomainChange will not be called.
    // Zoom is still allowed, indirectly, via state.options.timelineZoom and constants.timeline.zoomLevels.
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
            tickCount={constants.timeline.tickCount}
            tickLabelComponent={<VictoryLabel style={axisLabelStyle}/> as any}
            tickFormat={tickFormat}
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
