import * as d3 from 'd3';

import React, {
  Component,
} from 'react';

import {
  StyleSheet,
  View,
} from 'react-native';

import {
  VictoryAxis,
  VictoryChart,
  VictoryLabel,
  VictoryZoomContainer,
} from 'victory-native';

// import constants from 'lib/constants';

import constants from 'lib/constants';
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

interface Props {
}

const TimelineStyles = StyleSheet.create({
  timeline: {
    backgroundColor: constants.colors.timeline.background,
    height: constants.timeline.initialHeight,
    position: 'absolute',
    bottom: constants.safeAreaBottom,
    left: 0,
    right: 0,
    opacity: 1,
  },
})

class Timeline extends Component<Props> {

  public readonly state: State = initialState;
  public renderCount: number = 0;

  constructor(props: any) {
    super(props);
    this.handleZoom = this.handleZoom.bind(this);
  }

  public handleZoom(domain: any, props: any) {
    this.setState({ zoomDomain: domain }, () => {
      const timespans = (this as any)._timespans as any;
      if (timespans) {
        timespans.forceUpdate();
      }
    })
  }

  public render() {
    // this.renderCount++;
    // if (this.renderCount % 10 == 0) {
    //   log.debug('Timeline', this.renderCount);
    // }
    const now = Date.now()
    const timespanPadding = 100000;
    const timespansData = [
      {
        t1: now - 10000, // start
        t2: now, // end
      },
      {
        t1: now - 20000, // start
        t2: now, // end
      },
      {
        t1: now - 30000, // start
        t2: now + 5000, // end
      },
      {
        t1: now - 40000, // start
        t2: now + 10000, // end
      },
    ]
    const initialZoomDomain = {
      x: [now - timespanPadding, now + timespanPadding],
      y: [0, 10]
    }
    const axisStyle = {
      axis: { stroke: constants.colors.timeline.axis },
      grid: { stroke: (t: Date) => constants.colors.timeline.axis } as any,
      // ticks: { stroke: 'gray', size: 5 }, // appears below axis, not needed
      tickLabels: { fontSize: constants.timeline.tickLabelFontSize, padding: 0, stroke: constants.colors.timeline.axis },
    }
    const axisLabelStyle = {
      // fill: constants.colors.timeline.axisLabels,
      fontFamily: 'Verdana',
      fontSize: 10,
      letterSpacing: 'normal',
      padding: 0,
      stroke: constants.colors.timeline.axisLabels,
    }
    return (
      <View style={TimelineStyles.timeline}>
        <VictoryChart
          containerComponent={
            <VictoryZoomContainer
              minimumZoom={{ x: 1000, y: 1 }}
              responsive={true}
              zoomDimension="x"
              zoomDomain={this.state.zoomDomain as any}
              onZoomDomainChange={this.handleZoom}
            /> as any
          }
          domain={initialZoomDomain as any}
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
