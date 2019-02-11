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
import Timespans from 'presenters/Timespans';

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
    height: constants.timeline.initialHeight,
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

  public handleZoom(domain: DomainPropType, props: any) {
    this.setState({ zoomDomain: domain }, () => {
      this.props.zoomDomainChanged(domain);
      const timespans = (this as any)._timespans as any;
      if (timespans) {
        timespans.forceUpdate();
      }
    })
  }

  public render() {
    const { refTime, startupTime } = this.props;
    const { initialSpan } = constants.timeline;
    const timespansData = [
      {
        t1: startupTime - 90000, // start
        t2: startupTime, // end
      },
      {
        t1: startupTime - 60000, // start
        t2: startupTime, // end
      },
    ]
    log.trace('timespansData', timespansData);
    const initialZoomDomain: DomainPropType = {
      x: [startupTime - initialSpan / 2, startupTime + initialSpan / 2],
      y: [0, 10]
    }
    const axisStyle = {
      axis: { stroke: constants.colors.timeline.axis },
      grid: { stroke: (t: Date) => constants.colors.timeline.axis } as any,
      // ticks: { stroke: 'gray', size: 5 }, // appears below axis, not needed
      tickLabels: { fontSize: constants.timeline.tickLabelFontSize, padding: 0, stroke: constants.colors.timeline.axis },
    }
    const axisLabelStyle = {
      fontFamily: 'Futura',
      fontSize: 10,
      letterSpacing: 'normal',
      padding: 0,
      fill: constants.colors.timeline.axisLabels,
      style: { strokeWidth: 0 },
    }
    return (
      <View style={TimelineStyles.timeline}>
        <VictoryChart
          containerComponent={
            <VictoryZoomContainer
              minimumZoom={{ x: 1000, y: 1 }}
              responsive={true}
              zoomDimension="x"
              zoomDomain={this.state.zoomDomain}
              onZoomDomainChange={this.handleZoom}
            /> as any
          }
          domain={initialZoomDomain}
          height={constants.timeline.initialHeight}
          padding={{ bottom: constants.timeline.bottomPaddingForAxis, left: 0, right: 0, top: 0 }}
        >
          <VictoryAxis
            style={axisStyle}
            tickCount={constants.timeline.tickCount}
            tickLabelComponent={<VictoryLabel style={axisLabelStyle}/> as any}
            tickFormat={tickFormat}
          />
          <Timespans
            data={timespansData}
            ref={(timespans: any) => (this as any)._timespans = timespans}
          />
        </VictoryChart>
      </View>
    )
  }
}

export default Timeline;
