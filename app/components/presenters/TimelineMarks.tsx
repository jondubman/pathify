import * as React from 'react';
import { G, Line, Polygon, Polyline } from 'react-native-svg';
import * as Victory from 'victory-native';
const Rect = (Victory as any).Rect; // Primitives are missing from TypeScript type definitions for Victory

import constants from 'lib/constants';
import {
  Activity,
  MarkEvent,
  MarkEvents,
  MarkType
} from 'shared/marks';
import { activityIncludesMark } from 'lib/selectors';
import { Timepoint } from 'shared/timeseries';

interface TimelineMarksProps extends Victory.VictoryCommonProps, Victory.VictoryDatableProps {
  currentActivity: Activity | null;
  data: MarkEvents;
  selectedActivity: Activity | null;
}

class TimelineMarks extends React.Component<TimelineMarksProps> {

  constructor(props: any) {
    super(props);
  }

  public render() {
    const {
      currentActivity,
      data,
      selectedActivity
    } = this.props;
    const {
      scale, // as in d3 scale
    } = this.props as any;

    const { marks, timeline } = constants;
    const yTop = 0;

    const centerLine_x1 = (t: Timepoint): number => (Math.round(scale.x(t)));
    const centerLine_x2 = centerLine_x1; // vertical line: identical x1, x2
    const centerLine_y1 = (t: Timepoint): number => 0;
    const centerLine_y2 = (t: Timepoint): number => timeline.default.height - timeline.bottomPaddingForAxis;

    const colorFor = (mark: MarkEvent): string => {
      const { subtype, synthetic } = mark.data;
      const colors = constants.colors.marks;
      const selected: boolean = activityIncludesMark(selectedActivity, mark);
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

    const shapes = data.map((mark: MarkEvent, index: number) => (
      activityIncludesMark(selectedActivity, mark) || activityIncludesMark(currentActivity, mark) ?
        <G key={`G${index}`}>
          <Line
            key={`MarkLine${index}`}
            x1={centerLine_x1(mark.t)}
            y1={centerLine_y1(mark.t)}
            x2={centerLine_x2(mark.t)}
            y2={centerLine_y2(mark.t)}
            stroke={colorFor(mark)}
            strokeWidth={constants.marks.centerlineWidthSelected}
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
      :
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
          {/* <Rect
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
          /> */}
          {/* <Polyline
            key={`MarkHollow${index}`}
            fill='transparent'
            stroke={constants.colors.byName.white}
            points={hollow(mark.t)}
          /> */}
        </G>
    ))
    return shapes;
  }
}

export default TimelineMarks;
