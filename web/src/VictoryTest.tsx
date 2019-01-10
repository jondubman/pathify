// tslint:disable:max-classes-per-file

// @ts-ignore
// ignores typescript errors on subsequent line

import * as d3 from 'd3'; // TODO

import Radium from 'radium';
import * as React from 'react';
import {
  VictoryAxis,
  VictoryChart,
  VictoryZoomContainer,
} from 'victory';

// With Radium:
// <div style={styles.container} ... >
const styles = {
  container: { // for debugging, to see the extent of the entire chart
    height: 700,
    outlineColor: 'lightblue',
    outlineStyle: 'dotted',
    outlineWidth: 2,
    padding: 0,
    width: 1400,
  },
}

import * as Victory from 'victory';
const Rect = (Victory as any).Rect; // Primitives are missing from TypeScript type definitions for Victory

// Timespans component

interface TimespansProps extends Victory.VictoryCommonProps, Victory.VictoryDatableProps {
}

class Timespans extends React.Component<TimespansProps> {
  constructor(props: any) {
    super(props);
  }
  public render() {
    const {
      data,
      scale,
    } = this.props as any;

    const scaleUsed = scale.x;
    return data.map((d: any, index: number) => (
      <Rect
        style={{ fill: index ? 'red' : 'blue' }}
        x={scaleUsed(d.t1)}
        y={150 + 100 * index}
        width={scaleUsed(d.t2) - scaleUsed(d.t1)}
        height={50}
      />
    ))
  }
}

// VictoryTest component

const initialState = {
  zoomDomain: null as any,
}
type State = Readonly<typeof initialState>

const tickFormat = (t: Date) => {
  // TODO improve, and use multi-format
  // https://github.com/d3/d3-time-format/blob/master/README.md#timeFormat
  return d3.timeFormat('%I:%M:%S')(t);
}

class VictoryTest extends React.Component {

  public readonly state: State = initialState;

  constructor(props: any) {
    super(props);
    this.handleZoom = this.handleZoom.bind(this);
  }

  public handleZoom(domain: any, props: any) {
    console.log('handleZoom', props);

    this.setState({ zoomDomain: domain }, () => {
      const timespans = (this as any)._timespans as any;
      if (timespans) {
        timespans.forceUpdate();
      }
    })
  }

  public render() {
    const timespanPadding = 50000;
    const timespansData = [
      {
        t1: '1547071948644', // start
        t2: '1547071964838', // end
      },
      {
        t1: '1547071948044', // start
        t2: '1547071968838', // end
      },
    ]
    // TODO note bottom padding must be at least 25 for X axis on the bottom to be visible.
    return (
      <div style={styles.container}>
        <VictoryChart
          containerComponent={
            <VictoryZoomContainer
              minimumZoom={{ x: 10000, y: 1 }}
              responsive={false}
              zoomDimension="x"
              zoomDomain={this.state.zoomDomain as any}
              onZoomDomainChange={this.handleZoom}
            />
          }
          domain={{ x: [1547071948644 - timespanPadding, 1547071964838 + timespanPadding], y: [0, 10]}}
          height={700}
          padding={{ bottom: 25, left: 0, right: 0, top: 0 }}
          standalone={true}
          width={1400}
        >
          <Timespans
            data={timespansData}
            ref={(timespans: any) => (this as any)._timespans = timespans}
          />
          <VictoryAxis
            scale={{ x: "time" }}
            standalone={false}
            tickCount={10}
            tickFormat={tickFormat}
          />
        </VictoryChart>
      </div>
    )
  }
}

export default Radium(VictoryTest);
