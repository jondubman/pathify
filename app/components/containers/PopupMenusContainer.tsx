import { ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import PopupMenus from 'components/presenters/PopupMenus';
import {
  AppAction,
  newAction,
  SliderMovedParams
} from 'lib/actions';
import constants from 'lib/constants';
import {
  dynamicTimelineHeight,
} from 'lib/selectors';
import { AppState } from 'lib/state';
import { activitySummary } from 'lib/activitySummary';

export enum MenuItem {
  // activitySummary
  'DISTANCE' = 'DISTANCE',
  'ELEVATION' = 'ELEVATION',
  'EVENT_COUNT' = 'EVENT_COUNT',
  'MODE' = 'MODE',
  'SPEED' = 'SPEED',
  'TIME' = 'TIME',
  'TIMELINE_ZOOM' = 'TIMELINE_ZOOM',

  // clockMenu
  'CLEAR' = 'CLEAR',
  'LIST' = 'LIST',
  'MARK' = 'MARK',
  'NEXT' = 'NEXT',
  'NOW' = 'NOW',
  'PREV' = 'PREV',
  'ZOOM_IN' = 'ZOOM_IN',
  'ZOOM_OUT' = 'ZOOM_OUT',
}

export enum PopupMenuItemType {
  'BUTTON' = 'BUTTON', // default
  'SLIDER' = 'SLIDER',
}

export interface PopupMenuItem { // TODO icons?
  name: MenuItem; // must be unique; canonical way to refer to this menu
  defaultVisible?: boolean; // TODO is this needed?
  displayText?: string; // required for type BUTTON or default
  itemContainerStyle?: ViewStyle;
  itemStyle?: object; // TODO ViewStyle?
  itemUnderlayColor?: string,
  label?: string, // optional
  labelStyle?: ViewStyle;
  props?: any;
  textStyle?: object;
  type?: string;
}
export type PopupMenuItems = PopupMenuItem[];
export type PopupMenuConfig = {
  contentsStyle?: ViewStyle;
  defaultItemStyle?: ViewStyle; // otherwise item style will be the global default
  items: PopupMenuItem[];
  open?: boolean;
  style: ViewStyle;
}
export enum PopupMenuName {
  'activitySummary' = 'activitySummary',
  'clockMenu' = 'clockMenu',
}

// for clockMenu
const itemContainerStyle = {
  marginLeft: 5,
  marginTop: 5,
}
const itemStyle = {
  backgroundColor: constants.colors.byName.azure_dark,
  borderRadius: constants.activitySummary.itemBorderRadius,
  height: 60,
  width: 60,
}

// TODO not sure how to avoid repeating the construct Map<PopupMenuName, PopupMenuConfig> a few times when using new;
// new PopupMenusConfig gives an error, saying it refers to a type but it's being used as a value (?)
export type PopupMenusConfig = Map<PopupMenuName, PopupMenuConfig>;
export const initialMenus = new Map<PopupMenuName, PopupMenuConfig>([
  [PopupMenuName.activitySummary, {
    contentsStyle: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginLeft: constants.buttonSize + constants.buttonOffset,
      marginRight: constants.buttonSize + constants.buttonOffset,
    },
    items: [
    ] as PopupMenuItems,
    // open derived dynamically
    style: {
      left: 0,
      right: 0,
      borderTopWidth: 0,
      borderBottomLeftRadius: constants.buttonSize / 2,
      borderBottomRightRadius: constants.buttonSize / 2,
    } as ViewStyle,
  }],
  [PopupMenuName.clockMenu, {
    contentsStyle: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      // flexWrap: 'wrap',
    },
    defaultItemStyle: {
      margin: 5,
    },
    items: [
      // { name: 'cancelSelection', displayText: 'Cancel Selection' }, // starts selection process
      // { name: 'clearData', displayText: 'Clear data' },
      // { name: 'editMark', displayText: 'Edit Mark' },
      // { name: 'dateTime', displayText: 'Date/Time' },
      // { name: 'listView', displayText: 'List View', defaultVisible: true },
      // { name: 'markTimepoint', displayText: 'Mark Timepoint', defaultVisible: true },

      // { name: 'next', displayText: 'NEXT', defaultVisible: true },
      {
        name: MenuItem.TIMELINE_ZOOM,
        defaultVisible: true,
        type: PopupMenuItemType.SLIDER,
      },
      {
        name: MenuItem.ZOOM_OUT,
        displayText: '-',
        defaultVisible: true,
        itemContainerStyle,
        itemStyle,
        itemUnderlayColor: constants.colors.byName.azure,
      },
      {
        name: MenuItem.ZOOM_IN,
        displayText: '+',
        defaultVisible: true,
        itemContainerStyle,
        itemStyle,
        itemUnderlayColor: constants.colors.byName.azure,
      },
      {
        name: MenuItem.NOW,
        displayText: 'NOW',
        defaultVisible: true,
        itemContainerStyle,
        itemStyle,
        itemUnderlayColor: constants.colors.byName.azure,
      },
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
      height: constants.clockMenu.height,
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
  menuItemSelected: (name: string) => void;
  sliderMoved: (name: string, value: number) => void;
}

export type PopupMenusProps = PopupMenusStateProps & PopupMenusDispatchProps;

const mapStateToProps = (state: AppState): PopupMenusStateProps => {

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
          // TODO the number 6 is magic; it's 3 bars * 2 pixels each. Should go in constants.
          bottom: dynamicTimelineHeight(state) + 6 * constants.timeline.topLineHeight,
        },
      } as PopupMenuConfig;
      if (state.flags.mapFullScreen) {
        clockMenu.open = false; // hide clockMenu in mapFullScreen mode
      }
      const timelineZoomItem = clockMenu.items.find(item => item.name === MenuItem.TIMELINE_ZOOM);
      if (timelineZoomItem) {
        if (!timelineZoomItem.props) {
          timelineZoomItem.props = {};
        }
        (timelineZoomItem.props as any).sliderValue = state.options.timelineSliderValue;
      }
      menus.set(PopupMenuName.clockMenu, clockMenu);
    }
    if (menuName === PopupMenuName.activitySummary) {
      if (state.options.currentActivity || state.options.selectedActivity) {
        const activitySummaryPopup: PopupMenuConfig = menus.get(PopupMenuName.activitySummary)!;
        activitySummaryPopup.open = true;
        menus.set(PopupMenuName.activitySummary, activitySummary(state, activitySummaryPopup));
      }
    }
  }
  return { menus };
}

const mapDispatchToProps = (dispatch: Function): PopupMenusDispatchProps => {
  const dispatchers = {
    menuItemSelected: (name: string) => {
      dispatch(newAction(AppAction.menuItemSelected, name));
    },
    sliderMoved: (name: string, value: number) => {
      dispatch(newAction(AppAction.sliderMoved, { name, value } as SliderMovedParams));
    },
  }
  return dispatchers;
}

const PopupMenusContainer = connect<PopupMenusStateProps, PopupMenusDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(PopupMenus as any);

export default PopupMenusContainer;
