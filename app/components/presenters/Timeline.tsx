import * as d3 from 'd3';

import React, {
  Component,
} from 'react';

import {
  View,
} from 'react-native';

import {
    VictoryAxis,
    VictoryChart,
    VictoryZoomContainer,
} from 'victory-native';

// import constants from 'lib/constants';

import Timespans from 'components/presenters/Timespans';
import constants from 'lib/constants';
import log from 'lib/log';

const initialState = {
  zoomDomain: null as any,
}
type State = Readonly<typeof initialState>

const tickFormat = (t: Date) => {
  // TODO improve, and use multi-format
  // https://github.com/d3/d3-time-format/blob/master/README.md#timeFormat
  return d3.timeFormat('%I:%M:%S')(t);
}

interface Props extends React.Props<any> {
}

class Timeline extends Component<Props> {

  public readonly state: State = initialState;
  public renderCount: number = 0;

  constructor(props: any) {
    super(props);
    this.handleZoom = this.handleZoom.bind(this);
  }

  public handleZoom(domain: any, props: any) {
    // log.debug('handleZoom', domain);
    this.setState({ zoomDomain: domain }, () => {
      const timespans = (this as any)._timespans as any;
      if (timespans) {
        timespans.forceUpdate();
      }
    })
  }

  public render() {
    this.renderCount++;
    if (this.renderCount % 10 == 0) {
      log.debug('Timeline', this.renderCount);
    }

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
    ]
    const initialZoomDomain = { x: [now - timespanPadding, now + timespanPadding], y: [0, 10] };
    const victoryAxisStyle = {
      axis: { stroke: 'white' },
      axisLabel: { fontSize: 10, padding: 2 },
      // grid: { stroke: (t: Date) => 'white' },
      // ticks: { stroke: 'pink', size: 1 },
      tickLabels: { fontSize: 9, padding: 0, stroke: 'white' },
    }
    return (
      <View style={{ backgroundColor: '#004', height: constants.timeline.height }}>
        <VictoryChart
          containerComponent={
            <VictoryZoomContainer
              minimumZoom={{ x: 1000, y: 1 }}
              responsive={true}
              zoomDimension="x"
              zoomDomain={this.state.zoomDomain as any}
              onZoomDomainChange={this.handleZoom}
            />
          }
          domain={initialZoomDomain}
          height={constants.timeline.height}
          padding={{ bottom: constants.timeline.bottomPaddingForAxis, left: 0, right: 0, top: 0 }}
        >
          <Timespans
            data={timespansData}
            ref={(timespans: any) => (this as any)._timespans = timespans}
          />
          <VictoryAxis
            style={victoryAxisStyle}
            tickCount={5}
            tickFormat={tickFormat}
          />
        </VictoryChart>
      </View>
    )
  }
}

export default Timeline;
