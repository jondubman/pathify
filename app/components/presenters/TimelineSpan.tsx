import * as React from 'react';

import * as Victory from 'victory-native';
const Rect = (Victory as any).Rect; // Primitives are missing from TypeScript type definitions for Victory

import constants, { TimespanKind } from 'lib/constants';
import utils from 'lib/utils';

interface TimelineSpanProps {
  color?: string;
  kind: TimespanKind;
  xStart: number;
  xEnd: number;
}

// yBase is at the bottom of the timeline. y should decrease from there. Notice this function is recursive.
const yTop = (kind: TimespanKind): number => {
  const { timeline } = constants;
  const yBase = timeline.default.height - timeline.bottomPaddingForAxis - timeline.bottomPaddingForBars;
  switch (kind) {
    case TimespanKind.ACTIVITY:
      return Math.round(yBase / 2) - height(kind) / 2;
    case TimespanKind.APP_STATE:
      return 0; // APP_STATE at the top
    case TimespanKind.FUTURE:
      return yBase - height(kind); // top to bottom
    case TimespanKind.LOCATIONS:
      return yBase - height(kind); // LOCATIONS at the bottom
    case TimespanKind.MODE:
      break;
    case TimespanKind.MOTION:
      break;
    case TimespanKind.OTHER:
      return yTop(TimespanKind.LOCATIONS) - height(kind); // OTHER above LOCATIONS
    case TimespanKind.SELECTION:
      return yBase - height(kind); // top to bottom
    default:
      break;
  }
  return 0;
}

const height = (kind: TimespanKind): number => {
  switch (kind) {
    case TimespanKind.ACTIVITY:
      return constants.timeline.barHeight;
    case TimespanKind.APP_STATE:
      return constants.timeline.miniBarHeight;
    case TimespanKind.FUTURE:
      return constants.timeline.default.height;
    case TimespanKind.LOCATIONS:
      return constants.timeline.miniBarHeight;
    case TimespanKind.MODE:
      break;
    case TimespanKind.MOTION:
      break;
    case TimespanKind.OTHER:
      return constants.timeline.barHeight;
    case TimespanKind.SELECTION:
      return constants.timeline.default.height;
    default:
      break;
  }
  return 0;
}

class TimelineSpan extends React.PureComponent<TimelineSpanProps> {

  constructor(props: any) {
    super(props);
  }

  render() {
    utils.addToCount('renderTimelineSpan');
    const {
      color,
      kind,
      xStart,
      xEnd,
    } = this.props;
    return (
      <Rect
        key={`Rect${xStart}-${xEnd}`}
        style={{ fill: color ? color : constants.colors.timeline.timespans[kind] }}
        x={xStart}
        y={yTop(kind)}
        width={xEnd - xStart}
        height={height(kind)}
      />
    )
  }
}

export default TimelineSpan;
