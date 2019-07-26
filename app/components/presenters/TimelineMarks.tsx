import * as React from 'react';
import { Polygon, G, Svg } from 'react-native-svg';
import * as Victory from 'victory-native';
const Rect = (Victory as any).Rect; // Primitives are missing from TypeScript type definitions for Victory

import constants from 'lib/constants';
import log from 'shared/log';
import { MarkEvent, MarkEvents, MarkType } from 'shared/marks';
import { Timepoint } from 'shared/timeseries';

interface TimelineMarksProps extends Victory.VictoryCommonProps, Victory.VictoryDatableProps {
  data: MarkEvents;
}

class TimelineMarks extends React.Component<TimelineMarksProps> {

  constructor(props: any) {
    super(props);
  }

  public render() {
    const data = this.props.data;
    const {
      scale,
    } = this.props as any;

    const { marks, timeline } = constants;

    const yTop = 0;

    const pointsFor = (t: Timepoint): string => {
      const scaledX = Math.round(scale.x(t));
      const left = Math.round(scaledX - marks.rectWidth / 2);
      const right = Math.round(scaledX + marks.rectWidth / 2);
      const top = yTop + marks.rectHeight;
      const bottom = top + marks.pointLength;
      return `${left},${top} ${right},${top} ${scaledX},${bottom} ${left},${top}`;
    }

    const colorFor = (mark: MarkEvent): string => {
      const { subtype } = mark.data;
      const colors = constants.colors.marks;
      switch(subtype) {
        case MarkType.NONE:
          return colors.default;
        case MarkType.START:
          return colors.start;
        case MarkType.END:
          return colors.end;
        default:
          return colors.default;
      }
    }

    const shapes = data.map((mark: MarkEvent, index: number) => (
      <G key={`G${index}`}>
        <Rect
          key={`Mark${index}`}
          style={{ fill: colorFor(mark) }}
          x={Math.round(Math.round(scale.x(mark.t)) - marks.rectWidth / 2)}
          y={yTop}
          width={marks.rectWidth}
          height={marks.rectHeight}
        />
        <Polygon
          key={`MarkTriangle${index}`}
          fill={colorFor(mark)}
          points={pointsFor(mark.t)}
        />
      </G>
    ))

    // points = { '10,10 20,10 20,20 10,20 10,10'}

    // const shapes = data.map((mark: MarkEvent, index: number) => (
    //     <Rect
    //       key={`Mark${index}`}
    //       style={{ fill: constants.colors.byName.white }}
    //       x={scale.x(mark.t) - marks.rectWidth / 2}
    //       y={yTop}
    //       width={marks.rectWidth}
    //       height={marks.rectHeight}
    //     />
    // ))
    return shapes;
  }
}

export default TimelineMarks;
