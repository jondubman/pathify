import * as React from 'react';
import { G, Line, Polygon } from 'react-native-svg';
import * as Victory from 'victory-native';
const Rect = (Victory as any).Rect; // Primitives are missing from TypeScript type definitions for Victory

import constants from 'lib/constants';
import { MarkEvent, MarkEvents, MarkType } from 'shared/marks';
import { Timepoint } from 'shared/timeseries';
import { RSA_X931_PADDING } from 'constants';

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
      scale, // as in d3 scale
    } = this.props as any;

    const { marks, timeline } = constants;
    const yTop = 0;

    const triangle = (t: Timepoint): string => {
      const scaledX = Math.round(scale.x(t));
      const left = Math.round(scaledX - marks.rectWidth / 2);
      const right = Math.round(scaledX + marks.rectWidth / 2);
      const top = yTop + marks.rectHeight;
      const bottom = top + marks.pointLength;
      return `${left},${top} ${right},${top} ${scaledX},${bottom} ${left},${top}`;
    }

    const centerLine_x1 = (t: Timepoint): number => (Math.round(scale.x(t)));
    const centerLine_x2 = centerLine_x1; // vertical line: identical x1, x2
    const centerLine_y1 = (t: Timepoint): number => 0;
    const centerLine_y2 = (t: Timepoint): number => timeline.default.height - timeline.bottomPaddingForAxis;

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
        <Line
          key={`MarkLine${index}`}
          x1={centerLine_x1(mark.t)}
          y1={centerLine_y1(mark.t)}
          x2={centerLine_x2(mark.t)}
          y2={centerLine_y2(mark.t)}
          stroke={colorFor(mark)}
          strokeWidth={1}
        />
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
          points={triangle(mark.t)}
        />
      </G>
    ))
    return shapes;
  }
}

export default TimelineMarks;
