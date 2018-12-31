// tslint:disable:no-console
import * as d3 from 'd3';
import * as React from 'react';
// import { style } from 'd3';

import './App.css';
// import { rgb } from 'd3';

interface IDatum {
  t: number;
  speed: number;
  type: string;
}

// TODO replace magic numbers

class D3test extends React.Component {

  private startTime = new Date().getTime();
  private data = [ ] as IDatum[];

  private barWidth = 10;
  private axisHeight = 50;
  private xAxisTicks = 10;
  private contentHeight = 350;
  private totalHeight = this.axisHeight + this.contentHeight;
  private width = 1000;

  private timescaleDomain = [this.startTime, this.startTime + 30000]; // initial 30 second window on timelilne
  private timescaleRange = [ 0, this.width ];
  private originalTimescale = d3.scaleTime()
    .domain(this.timescaleDomain)
    .range(this.timescaleRange)
  private currentTimescale = this.originalTimescale;
  private yscale = d3.scaleLinear()
    .domain([0, 20]) // TODO
    .range([0, this.contentHeight]);

  private zoomScaleExtent = [0.1, 10] as [number, number];

  public key = (d: any, i: number) => d.t;

  public update() {
    // Update any old bars
    d3.select('.content')
      .selectAll('rect')
      .data(this.data, this.key)
      .attr('x', (d, i) => this.currentTimescale(this.startTime + d.t))
      .attr('width', this.barWidth)

    // Create any new bars
    d3.select('.content')
      .selectAll('rect')
      .data(this.data, this.key)
      .enter()
      .append('rect')
      .attr('x', (d, i) => this.currentTimescale(this.startTime + d.t))
      .attr('y', (d, i) => this.contentHeight - this.yscale(d.speed))
      .attr('width', this.barWidth)
      .attr('height', (d, i) => this.yscale(d.speed))
      .attr('fill', (d, i) => (d.t < 10000 ? 'gray' : (i % 2 ? 'blue' : 'orange')))

    // Remove bars whose corresponding data is gone
    d3.select('.svg')
      .selectAll('rect')
      .data(this.data, this.key)
      .exit()
      .remove();
  }

  public componentDidMount() {

    // Attach new svg tag to d3hook element
    d3.select('#d3hook')
      .append('svg') // svg tag for the d3-rendered timeline.
      .attr('class', 'svg')
      .attr('width', this.width) // note could be "100%"...
      .attr('height', this.totalHeight)
      .append('g')
      .attr('class', 'content')

    // Create X axis at the bottom
    const axis = d3.axisBottom(this.currentTimescale)
      .ticks(this.xAxisTicks)
      .tickFormat(d3.timeFormat('%I:%M:%S'))
    d3.select('.svg')
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', 'translate(0,' + this.contentHeight + ')') // place on the bottom
      .call(axis) // actually append the axis to the DOM

    const zoomFunction = () => {
      console.log(d3.event.transform);
      this.currentTimescale = d3.event.transform.rescaleX(this.originalTimescale);
      d3.select('.x-axis')
        .call(axis.scale(this.currentTimescale))

      this.update();
    }

    // Handle zoom
    d3.select('.svg')
      .call(d3.zoom()
        .scaleExtent(this.zoomScaleExtent)
        .on('zoom', zoomFunction)
      )

    // Call update the first time to create initial d3 elements
    this.update();

    const increment = 1000;
    let offset = 0;
    let r = 5;
    const interval = setInterval(() => {
      this.data.push({ t: offset, speed: r, type: 'loc' });

      r += (Math.random() - 0.5) * 2;
      if (r < 0) { r = 0 };
      if (r > 20) { r = 20 };

      this.update();
      offset += increment;
    }, increment)

    setTimeout(() => clearInterval(interval), 20000); // stop adding data after 20 seconds
  }

  public shouldComponentUpdate() {
    return false; // Tell React not to re-render this component
  }

  public render() {
    // tslint:disable-next-line:no-unused-expression
    return (
      <div>
        <div className="container d3test" id="d3hook" />
      </div>
    )
  }
}

export default D3test;
