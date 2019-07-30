import { ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import PopupMenus from 'components/presenters/PopupMenus';
import constants from 'lib/constants';
import { dynamicTimelineHeight } from 'lib/selectors';
import { AppState } from 'lib/state';
import utils from 'lib/utils';
import log from 'shared/log';
import { activityMetrics, ActivityMetricName } from 'shared/metrics';

export interface PopupMenuItem {
  name: string; // must be unique; canonical way to refer to this menu

  defaultVisible?: boolean;
  displayText: string; // TODO icons?

  itemStyle?: object; // TODO ViewStyle?
  itemUnderlayColor?: string,
  textStyle?: object;
}
export type PopupMenuItems = PopupMenuItem[];
export type PopupMenuConfig = {
  defaultItemStyle?: string; // otherwise item style will be the global default
  items: PopupMenuItem[];
  open?: boolean;
  style: ViewStyle;
}
export enum PopupMenuName {
  'activitySummary' = 'activitySummary',
  'clockMenu' = 'clockMenu',
}
// TODO not sure how to avoid repeating the construct Map<PopupMenuName, PopupMenuConfig> a few times when using new;
// new PopupMenusConfig gives an error, saying it refers to a type but it's being used as a value (?)
export type PopupMenusConfig = Map<PopupMenuName, PopupMenuConfig>;
export const initialMenus = new Map<PopupMenuName, PopupMenuConfig>([
  [PopupMenuName.activitySummary, {
    items: [
    ] as PopupMenuItems,
    // open derived dynamically from flags.activitySummaryOpen
    style: {
      left: 0,
      right: 0,
      height: constants.activitySummary.height,
      bottom: utils.windowSize().height - constants.activitySummary.height,
      borderTopWidth: 0,
      borderBottomLeftRadius: constants.buttonSize / 2,
      borderBottomRightRadius: constants.buttonSize / 2,
    } as ViewStyle,
  }],
  [PopupMenuName.clockMenu, {
    items: [
      // { name: 'cancelSelection', displayText: 'Cancel Selection' }, // starts selection process
      // { name: 'clearData', displayText: 'Clear data' },
      // { name: 'editMark', displayText: 'Edit Mark' },
      // { name: 'dateTime', displayText: 'Date/Time' },
      // { name: 'listView', displayText: 'List View', defaultVisible: true },
      // { name: 'markTimepoint', displayText: 'Mark Timepoint', defaultVisible: true },

      // { name: 'next', displayText: 'NEXT', defaultVisible: true },
      // { name: 'now', displayText: 'NOW', defaultVisible: true },
      // { name: 'prev', displayText: 'PREVIOUS', defaultVisible: true },

      // { name: 'removeMark', displayText: 'Remove Mark' },
      // { name: 'saveTimespan', displayText: 'Save Timespan' },
      // { name: 'selectTimespan', displayText: 'Select Timespan', defaultVisible: true }, // starts selection process
      // { name: 'zoomTimeline', displayText: 'Zoom Timeline', defaultVisible: true }, // in, out, level, etc.
    ] as PopupMenuItems,
    // open derived dynamically from flags.clockMenuOpen
    style: {
      borderTopLeftRadius: constants.buttonSize / 2,
      borderTopRightRadius: constants.buttonSize / 2,
      left: 0,
      right: 0,
      height: 280,
    } as ViewStyle,
  }],
  // [ PopupMenuName.menuNext, {
  //   items: [
  //     { name: 'endActivity', displayText: 'End of Activity' },
  //     { name: 'endTimespan', displayText: 'End of Timespan' },
  //     { name: 'nextActivity', displayText: 'Next Activity' },
  //     { name: 'nextMark', displayText: 'Next Mark' },
  //     { name: 'nextTimespan', displayText: 'Next Timespan' },
  //     { name: 'now', displayText: 'NOW', defaultVisible: true },
  //   ],
  //   // open derived dynamically from flags.menuNextOpen
  // }],
  // [ PopupMenuName.menuPrev, {
  //   items: [
  //     { name: 'back', displayText: 'Back' }, // to where you were before
  //     { name: 'prevActivity', displayText: 'Prev Activity' },
  //     { name: 'prevMark', displayText: 'Previous Mark' },
  //     { name: 'prevTimespan', displayText: 'Previous Timespan' },
  //     { name: 'startActivity', displayText: 'Start of Activity' },
  //     { name: 'startTimespan', displayText: 'Start of Timespan' },
  //   ],
  //   // open derived dynamically from flags.menuPrevOpen
  // }],
  // [ PopupMenuName.menuZoomTimeline, {
  //   items: [
  //     { name: 'in', displayText: 'In' },
  //     { name: 'out', displayText: 'Out' },
  //   ],
  //   // open derived dynamically from flags.menuZoomTimelineOpen
  // }],
]) as PopupMenusConfig;

interface PopupMenusStateProps {
  menus: PopupMenusConfig;
}

interface PopupMenusDispatchProps {
}

export type PopupMenusProps = PopupMenusStateProps & PopupMenusDispatchProps;

const mapStateToProps = (state: AppState): PopupMenusDispatchProps => {

  const menus: PopupMenusConfig = new Map(state.menus);
  for (let [menuName, menu] of menus) {
    // Set the open flag as needed based on state.flags.
    // If open is not set already, inherit it from the corresponding AppState flag with a name ending in 'Open'.
    if (typeof menu.open === 'undefined') {
      menus.set(menuName, { ...menu, open: state.flags[menuName + 'Open'] });
    }
    if (menuName === PopupMenuName.clockMenu) {
      const clockMenuBaseStyle = menu.style;
      const clockMenu = {
        ...menus.get(PopupMenuName.clockMenu),
        style: {
          ...clockMenuBaseStyle,
          // position clockMenu above timeline and the horizontal separators that form its top edge
          bottom: dynamicTimelineHeight(state) + 6 * constants.timeline.topLineHeight,
        },
      } as PopupMenuConfig;
      if (state.flags.mapFullScreen) {
        clockMenu.open = false; // hide clockMenu in mapFullScreen mode
      }
      menus.set(PopupMenuName.clockMenu, clockMenu);
    }
    if (menuName === PopupMenuName.activitySummary && state.flags.activitySummaryOpen) { // otherwise no point
      if (state.options.currentActivity) {
        let activitySummary: PopupMenuConfig = { ...menus.get(PopupMenuName.activitySummary)! };

        // TODO t is not always refTime in the general case
        const metrics = activityMetrics(state.events, state.options.currentActivity, state.options.refTime);
        const totalDistanceMetric = metrics.get(ActivityMetricName.totalDistance)!;
        const totalDistanceDisplayText = totalDistanceMetric ?
          totalDistanceMetric.text! + ' ' + totalDistanceMetric.units! : '';

        activitySummary.items = [
          ...activitySummary.items,
          {
            displayText: 'Total distance',
            name: 'totalDistanceLabel',
            itemStyle: {
              top: constants.safeAreaTop + constants.buttonOffset,
              left: constants.buttonSize + constants.buttonOffset * 2,
            },
            textStyle: {},
          },
          {
            displayText: totalDistanceDisplayText,
            name: 'totalDistance',
            itemStyle: {
              top: constants.safeAreaTop + constants.buttonOffset + 20,
              left: constants.buttonSize + constants.buttonOffset * 2,
            },
            textStyle: {},
          },
        ]
        menus.set(PopupMenuName.activitySummary, activitySummary!);
      } else {
        log.warn('activitySummary open without state.options.currentActivity');
      }
    }
  }
  return { menus };
}

const mapDispatchToProps = (dispatch: Function): PopupMenusDispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const PopupMenusContainer = connect<PopupMenusStateProps, PopupMenusDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(PopupMenus as any);

export default PopupMenusContainer;
