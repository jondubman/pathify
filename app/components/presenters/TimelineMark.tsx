import * as React from 'react';
import { G, Line, Polygon } from 'react-native-svg';
import * as Victory from 'victory-native';
const Rect = (Victory as any).Rect; // Primitives are missing from TypeScript type definitions for Victory

import constants from 'lib/constants';
import {
  MarkEvent,
  MarkType
} from 'lib/marks';
import {
  activityIncludesMark,
  bottomPaddingForAxis,
  timelineHeightIfShowing
} from 'lib/selectors';
import { Timepoint } from 'lib/timeseries';

interface TimelineMarkProps {
  currentActivityId: string;
  index: number;
  mark: MarkEvent,
  scale: any,
  selectedActivityId: string;
}

class TimelineMark extends React.Component<TimelineMarkProps> {

  constructor(props: any) {
    super(props);
  }

  // shouldComponentUpdate(nextProps: TimelineMarkProps, nextState: any) {
  //   return (JSON.stringify(this.props) !== JSON.stringify(nextProps)); // TODO upgrade quick & dirty approach
  // }

  render() {
    const {
      currentActivityId,
      index,
      mark,
      selectedActivityId,
    } = this.props;
    const {
      scale, // as in d3 scale
    } = this.props as any;

    const { marks, timeline } = constants;
    const yTop = 0;

    const centerLine_x1 = (t: Timepoint): number => (Math.round(scale.x(t)));
    const centerLine_x2 = centerLine_x1; // vertical line: identical x1, x2
    const centerLine_y1 = (t: Timepoint): number => 0;
    const centerLine_y2 = (t: Timepoint): number => timelineHeightIfShowing(this.state as any) - bottomPaddingForAxis(this.state as any);

    const colorFor = (mark: MarkEvent): string => {
      const { subtype, synthetic } = mark;
      const colors = constants.colors.marks;
      const selected: boolean = activityIncludesMark(selectedActivityId, mark);
      switch (subtype) {
        case MarkType.NONE:
          return colors.default;
        case MarkType.START:
          return selected ? colors.startSelected : colors.start;
        case MarkType.END:
          if (synthetic) {
            return selected ? colors.syntheticEndSelected : colors.syntheticEnd;
          } else {
            return selected ? colors.endSelected : colors.end;
          }
        default:
          return colors.default;
      }
    }

    // const hollow = (t: Timepoint): string => {
    //   const center = Math.round(scale.x(t));
    //   const left = Math.round(center - marks.rectWidth / 2);
    //   const right = Math.round(center + marks.rectWidth / 2);
    //   const tipTop = yTop + marks.rectHeight;
    //   const bottom = tipTop + marks.pointLength;
    //   return `${left},${yTop} ${right},${yTop} ${right},${tipTop} ${center},${bottom} ${left},${tipTop} ${left},${yTop}`;
    // }

    const triangle = (t: Timepoint): string => {
      const center = Math.round(scale.x(t));
      const left = Math.round(center - marks.rectWidth / 2);
      const right = Math.round(center + marks.rectWidth / 2);
      const top = yTop + marks.rectHeight;
      const bottom = top + marks.pointLength;
      return `${left},${top} ${right},${top} ${center},${bottom} ${left},${top}`;
    }

    return (
      activityIncludesMark(selectedActivityId, mark) || activityIncludesMark(currentActivityId, mark) ? (
        <G key={`G${index}`}>
          <Line
            key={`MarkLine${index}`}
            x1={centerLine_x1(mark.t)}
            y1={centerLine_y1(mark.t)}
            x2={centerLine_x2(mark.t)}
            y2={centerLine_y2(mark.t)}
            stroke={colorFor(mark)}
            strokeWidth={marks.centerlineWidthSelected}
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
      )
      :
      (
        <G key={`G${index}`}>
          <Line
            key={`MarkLine${index}`}
            x1={centerLine_x1(mark.t)}
            y1={centerLine_y1(mark.t)}
            x2={centerLine_x2(mark.t)}
            y2={centerLine_y2(mark.t)}
            stroke={colorFor(mark)}
            strokeWidth={constants.marks.centerlineWidthDefault}
          />
        </G>
      )
    )
  }
}

export default TimelineMark;
