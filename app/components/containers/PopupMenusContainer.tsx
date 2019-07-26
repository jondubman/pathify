import { connect } from 'react-redux';

import PopupMenus from 'components/presenters/PopupMenus';
import constants from 'lib/constants';
import { dynamicTimelineHeight } from 'lib/selectors';
import { AppState } from 'lib/state';
import utils from 'lib/utils';
import log from 'shared/log';

export interface PopupMenuItem {
  name: string; // must be unique; canonical way to refer to this menu

  defaultVisible?: boolean;
  displayText: string; // TODO icons

  itemStyle?: object;
  itemUnderlayColor?: string,
  textStyle?: object;
}
export type PopupMenuConfig = {
  defaultItemStyle?: string; // otherwise default style will be the global default
  items: PopupMenuItem[];
  open?: boolean;

  bottom?: number;
  top?: number;
  left?: number;
  right?: number;
  height?: number;
  width?: number;
}
export enum PopupMenuName {
  'menuClock' = 'menuClock',
  // 'menuNext' = 'menuNext',
  // 'menuPrev' = 'menuPrev',
  // 'menuZoomTimeline' = 'menuZoomTimeline',
}
// TODO not sure how to avoid repeating the construct Map<PopupMenuName, PopupMenuConfig> a few times when using new;
// new PopupMenusConfig gives an error, saying it refers to a type but it's being used as a value (?)
export type PopupMenusConfig = Map<PopupMenuName, PopupMenuConfig>;
export const initialMenus = new Map<PopupMenuName, PopupMenuConfig>([
  [PopupMenuName.menuClock, {
    items: [
      // { name: 'cancelSelection', displayText: 'Cancel Selection' }, // starts selection process
      // { name: 'clearData', displayText: 'Clear data' },
      // { name: 'editMark', displayText: 'Edit Mark' },
      // { name: 'dateTime', displayText: 'Date/Time' },
      // { name: 'listView', displayText: 'List View', defaultVisible: true },
      // { name: 'markTimepoint', displayText: 'Mark Timepoint', defaultVisible: true },

      { name: 'next', displayText: 'NEXT', defaultVisible: true },
      { name: 'now', displayText: 'NOW', defaultVisible: true },
      { name: 'prev', displayText: 'PREVIOUS', defaultVisible: true },

      // { name: 'removeMark', displayText: 'Remove Mark' },
      // { name: 'saveTimespan', displayText: 'Save Timespan' },
      // { name: 'selectTimespan', displayText: 'Select Timespan', defaultVisible: true }, // starts selection process
      // { name: 'zoomTimeline', displayText: 'Zoom Timeline', defaultVisible: true }, // in, out, level, etc.
    ],
    // open derived dynamically from flags.menuClockOpen
    height: 280,
    width: utils.windowSize().width,
  }],
  // [PopupMenuName.menuNext, {
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
  // [PopupMenuName.menuPrev, {
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
  // [PopupMenuName.menuZoomTimeline, {
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
  // Set the open flag as needed based on state.flags.
  const menus: PopupMenusConfig = new Map<PopupMenuName, PopupMenuConfig>(state.menus);
  for (let [menuName, menu] of menus) {
    if (typeof menu.open === 'undefined') {
      menus.set(menuName, { ...menu, open: state.flags[menuName + 'Open'] });
    }
  }
  // Position menuClock
  const menuClock = {
    ...menus.get(PopupMenuName.menuClock),
    bottom: dynamicTimelineHeight(state),
    left: utils.windowSize().width / 2 - menus.get(PopupMenuName.menuClock)!.width! / 2,
  } as PopupMenuConfig;
  menus.set(PopupMenuName.menuClock, menuClock);

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
