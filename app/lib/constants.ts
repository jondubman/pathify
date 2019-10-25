// constants module

import * as uuid from 'uuid/v4';
const clientId = uuid.default(); // TODO perist

import SafeAreaView from 'react-native-safe-area-view-with-get-inset';
import { DomainTuple } from 'victory-native';
const getInset = (SafeAreaView as any).getInset;
const safeAreaTop =  getInset('top');
const safeAreaBottom = getInset('bottom');
const bottomPaddingForAxis = safeAreaBottom ? 28 : 14; // empirically optimized for displays with/without home button

import { interval } from 'shared/timeseries';

export enum TimespanKind {
  'ACTIVITY' = 'ACTIVITY',
  'APP_STATE' = 'APP_STATE',
  'LOCATIONS' = 'LOCATIONS',
  'MODE' = 'MODE',
  'MOTION' = 'MOTION',
  'OTHER' = 'OTHER',
  'SELECTION' = 'SELECTION',
}

export interface MapStyle {
  name: string;
  opacity: number;
  url: string; // Mapbox style
}

const namedColors = { // note: each must be 6 digits for withOpacity; avoid 3 digit abbreviation
  // https://clrs.cc
  // https://www.colorhexa.com
  aqua: '#7fdbff',
  azure: '#007fff',
  azure_dark: '#003b76',
  blue: '#0074d9',
  fuschia: '#f012be',
  gray: '#aaaaaa',
  green: '#2ecc40',
  maroon: '#85144b',
  navy: '#001f3f',
  orange: '#ff851b',
  purple: '#b10dc9',
  red: '#ff4136',
  red_dark: '#4a0400',
  silver: '#dddddd',
  teal: '#39cccc',
  yellow: '#ffdc00',

  darkerGray: '#888888',
  darkGreen: '#239c31',
  darkerGreen: '#035a0d',
  darkRed: '#bf0a00',
  black: '#000000',
  white: '#ffffff',
}

const colorThemes = {
  background: namedColors.black,
  settings: namedColors.darkerGray,
}

const buttonOffset = 6;
const buttonSize = 50;
const defaultOpacity = 0.65;
const fontFamily = 'Futura';
const mapLogoHeight = 34; // mapbox logo
const initialTimelineHeight = 90; // maybe max 150
const panelWidth = 252; // fits on iPhone SE
const clockHeight = 70;
const clockMargin = 4;

// helper: pad with zeros as needed
const zeroPrefix = (s: string) => (s.length ? (s.length === 1 ? '0' + s : s) : '00')
// helper: dec should be between 0 and 1; e.g. 0.8 => 'cc'
const dec1ToHexFF = (dec: number) => zeroPrefix(Math.round(dec * 255).toString(16));

// 0 <= opacity <= 1
export const withOpacity = (color: string, opacity: number): string => (color + dec1ToHexFF(opacity));

const colors = {
  activityDetails: {
    itemBackground_current: withOpacity(namedColors.green, 0.5),
    itemBackground_selected: withOpacity(namedColors.azure, 0.5),
  },
  appBackground: colorThemes.background,
  appText: 'black',
  byName: namedColors, // all of them
  clock: {
    background: withOpacity(namedColors.black, 0.7),
    border: withOpacity(namedColors.azure, 0.9),
    backgroundNow: withOpacity(namedColors.darkerGreen, 0.65),
    backgroundPast: withOpacity(namedColors.azure_dark, 0.75),
    backgroundStopped: withOpacity(namedColors.black, 0.7),
    backgroundStoppedPast: withOpacity(namedColors.darkRed, 0.7),
    underlay: withOpacity(namedColors.black, 0.5),
  },
  compassButton: {
    background: 'white',
    icon: 'black',
    underlay: namedColors.purple,
  },
  debugInfo: {
    backgroundColor: withOpacity(namedColors.black, 0.65),
    borderColor: withOpacity(namedColors.gray, 0.2),
    borderWidth: 2,
    text: 'white',
  },
  followMeButton: {
    background: { active: namedColors.blue, inactive: 'black' },
    icon: { active: 'black', inactive: namedColors.azure },
    underlay: namedColors.azure,
  },
  geolocationButton: {
    background: 'white',
    opacity: 0.75, // TODO use withOpacity
    disabledBackground: namedColors.green,
    disabledUnderlay: namedColors.yellow, // in transition
    enabledBackground: namedColors.red,
    enabledUnderlay: namedColors.darkRed, // in transition
  },
  helpButton: {
    background: 'white',
    icon: 'black',
    underlay: namedColors.yellow,
  },
  map: {
    dimmer: namedColors.black,
  },
  marks: {
    default: namedColors.gray,
    start: withOpacity(namedColors.darkGreen, 0.75),
    startSelected: namedColors.green,
    end: withOpacity(namedColors.darkRed, 0.75),
    endSelected: namedColors.red,
    syntheticEnd: withOpacity(namedColors.yellow, 0.75),
    syntheticEndSelected: namedColors.yellow,
  },
  menus: {
    background: withOpacity(namedColors.black, 0.7),
    border: withOpacity(namedColors.azure, 0.7),
    buttons: withOpacity(namedColors.azure, 0.5),
    underlayColor: 'transparent',
  },
  nowButton: {
    background: 'transparent',
    icon: withOpacity(namedColors.darkGreen, 0.75),
    text: namedColors.black,
    underlay: namedColors.maroon,
  },
  refTime: {
    background: withOpacity(namedColors.navy, 0.75),
    hoursMinutes: namedColors.white,
    seconds: withOpacity(namedColors.white, 0.75),
    msec: withOpacity(namedColors.white, 0), // TODO show sometimes?
    subText: withOpacity(namedColors.white, 0.75),
    underlay: 'transparent',
  },
  paths: {
    transparent: 'transparent',
    current: withOpacity(namedColors.green, 0.75),
    default: withOpacity(namedColors.blue, 0.75),
  },
  settingsButton: {
    background: 'white',
    icon: 'black',
    underlay: colorThemes.settings,
  },
  settingsPanel: {
    background: withOpacity(colorThemes.background, defaultOpacity),
    border: colorThemes.settings,
    choiceUnderlay: withOpacity(colorThemes.settings, 0.5),
    opacitySliderBackground: withOpacity(colorThemes.settings, 0.3),
  },
  timeline: {
    axis: namedColors.darkerGray,
    axisLabels: namedColors.gray,
    background: colorThemes.background,
    currentActivity: withOpacity(namedColors.green, 0.75),
    selectedActivity: withOpacity(namedColors.blue, 1), // special case when timespan is selected
    timespans: {
      [TimespanKind.ACTIVITY]: withOpacity(namedColors.blue, 0.65), // unselected state (selectedActivity color above)
      [TimespanKind.APP_STATE]: namedColors.white, // opacity applied later
      [TimespanKind.LOCATIONS]: withOpacity(namedColors.blue, 0.35),
      [TimespanKind.OTHER]: withOpacity(namedColors.darkRed, 0.35),
      [TimespanKind.MODE]: withOpacity(namedColors.fuschia, 0.25), // TODO
      [TimespanKind.MOTION]: withOpacity(namedColors.yellow, 0.25), // TODO
      [TimespanKind.SELECTION]: withOpacity(namedColors.white, 0.25), // spans the whole timeline vertically
    },
    centerLine: withOpacity(namedColors.white, 0.5),
    topLine: withOpacity(namedColors.gray, 0.5),
  },
  user: namedColors.azure,
}

// --------------------------------------------------------------------------------------------------------------------

const constants = {
  activityDetails: {
    heightCollapsed: 60,
    heightExpanded: 166,
    itemBorderRadius: 5,
    itemHeight: 55,
    itemMargin: 5,
    itemsWhenCollapsed: 2,
    itemsWhenExpanded: 6,
  },
  appName: 'Pathify',
  buttonOffset,
  buttonSize,
  clientId,
  clock: {
    border: {
      width: 1,
      color: withOpacity(colors.byName.white, 0.65),
    },
    centerCircle: {
      color: withOpacity(colors.byName.red, 1),
      radius: 3,
    },
    height: clockHeight, // which is also width
    hourHand: {
      color: withOpacity(colors.byName.white, 1),
      lengthRatio: 0.6,
      thickness: 3,
    },
    margin: clockMargin,
    minuteHand: {
      color: withOpacity(colors.byName.white, 1),
      lengthRatio: 1,
      thickness: 2,
    },
    secondHand: {
      color: withOpacity(colors.byName.orange, 1),
      lengthRatio: 1,
      thickness: 1,
    },
    ticks: {
      count: 60,
      major: {
        color: withOpacity(colors.byName.white, 0.75),
        length: 10,
        width: 1,
      },
      minor: {
        color: withOpacity(colors.byName.gray, 0.75),
        length: 5,
        width: 1,
      },
    },
    width: clockHeight, // Note this is not a typo. Width and height are identical because clock is round.
  },
  clockMenu: {
    height: 240,
    sliderMargin: 20,
  },
  colors,
  colorThemes,
  compassButton: {
    aboveDynamicBase: buttonSize + buttonOffset * 2,
    rightOffset: buttonOffset,
    mapHeadingThreshold: 1, // (unit: degrees) minimum map heading/bearing required to show CompassButton
    opacity: defaultOpacity,
    size: buttonSize,
  },
  days: [
    'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'
  ],
  debugInfo: {
    borderWidth: 2,
    height: 100,
    padding: 5,
    // width: 280,
    width: 200,
  },
  followMeButton: {
    opacity: defaultOpacity,
    rightOffset: buttonOffset,
    size: buttonSize,
  },
  fonts: {
    colors: {
      default: 'white',
    },
    family: fontFamily,
    sizes: {
      choice: 15,
      choiceLabel: 12,
    },
  },
  geolocationAgeThreshold: 5000, // msec; those older than this are queued when they arrive and submitted in batch
  geolocationButton: {
    leftOffset: buttonOffset,
    opacity: defaultOpacity,
    size: buttonSize,
  },
  helpButton: {
    opacity: defaultOpacity,
    rightOffset: buttonOffset,
    size: buttonSize,
  },
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  map: {
    centerMapDuration: 500, // TODO not honored on iOS https://github.com/nitaliano/react-native-mapbox-gl/issues/1411
    // TODO fitBounds can be used instead
    default: {
      opacity: 1,
      style: 'None', // e.g. None, Default, Topo, Satellite. See mapStyles name TODO3
      zoom: 14,
      zoomStartActivity: 16,
    },
    opacityUnderPanels: defaultOpacity, // TODO adjust
    reorientationTime: interval.seconds(1) / 2,
  },
  mapLogoHeight,
  mapStyles: [
    { name: 'None', opacity: 1, url: '' },
    { name: 'Default', opacity: 1, url: 'mapbox://styles/jdubman/cjgsnrhnz000d2rqkgscnpycp' },
    { name: 'Topo', opacity: 1, url: 'mapbox://styles/jdubman/cjgsnuof2000q2rpqejq83nq0' },
    { name: 'Satellite', opacity: 1, url: 'mapbox://styles/jdubman/cjgsp7p4g00102rs3w4wcr655' },
  ] as MapStyle[],
  marks: {
    centerlineWidthDefault: 1.5,
    centerlineWidthSelected: 3,
    rectWidth: 12,
    rectHeight: 0,
    pointLength: 30,
  },
  menus: {
    defaultItemContainerStyle: {
    },
    defaultItemStyle: {
      alignSelf: 'center',
      backgroundColor: 'transparent',
      justifyContent: 'center', // centers item vertically
      margin: 0,
      padding: 0,
    },
    defaultItemUnderlayColor: colors.menus.underlayColor,
    defaultLabelStyle: {
      color: colors.byName.white,
      fontFamily,
      fontSize: 12,
      margin: 0,
      padding: 0,
      textAlign: 'center', // centers text horizontally
    },
  defaultTextStyle: {
      color: colors.byName.white,
      fontFamily,
      fontSize: 16,
      margin: 0,
      padding: 0,
      textAlign: 'center', // centers text horizontally
    },
  },
  months: [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ],
  maxTimeGapForContinuousTrack: interval.seconds(5),
  nowButton: {
    iconSize: clockHeight - 8,
    margin: clockMargin,
  },
  panelWidth,
  paths: {
    width: 8,
  },
  refTime: {
    bottomMargin: 7, // leaves enough room for iOS control center access at bottom of screen when timeline hidden
    height: 46,
    leftContentsWidth: 60,
    width: 126,
  },
  safeAreaBottom,
  safeAreaTop,
  serverDelayAfterFailedRequest: interval.seconds(5), // TODO may want to back off for some time if things go offline.
  serverUrl: 'https://pathify.app:3000/', // TODO
  settingsButton: {
    leftOffset: buttonOffset,
    opacityWhenClosed: defaultOpacity,
    opacityWhenOpen: 1,
    size: buttonSize,
    topOffset: safeAreaTop,
  },
  settingsPanel: {
    height: 300, // tallest it can be without covering up Geolocation button on iPhone SE with Timeline showing
    leftOffset: buttonOffset,
    subpanelLeftOffset: buttonOffset,
    subpanelTopOffset: buttonSize + buttonOffset,
    topOffset: safeAreaTop,
  },
  timing: { // msec
    backgroundTaskSlackTime: 5000,
    opacitySliderThrottle: 50,
    pulsarPulse: 1000,
    scrollViewWaitForMomentumScroll: 20, // TODO2
    timelineCloseToNow: 5000, // TODO2
    timelineZoomThrottle: 100,
    timerTickInterval: 1000,
    watchPositionInterval: 1000,
  },
  timeline: {
    barHeight: 40, // big enough to be touchable
    bottomPaddingForAxis,
    bottomPaddingForBars: 0,
    centerLineWidth: 3,
    default: {
      height: initialTimelineHeight + bottomPaddingForAxis,
      zoomValue: 0.64, // between 0 (min zoom) and 1 (max zoom) relative to zoomLevels below (0.7 is a good default)
    },
    miniBarHeight: 15,
    nearTimeThreshold: interval.minute, // TODO
    tickLabelFontSize: 12, // smaller is hard to read; bigger takes up too much room
    topLineHeight: 1,
    widthMultiplier: 10, // >1, important for smooth panning of the timeline. Larger means harder to reach the edge.
    yDomain: [0, 10] as DomainTuple, // The nonzero quantity here is sort of arbitrary; it establishes a scale.
    zoomLevels: [ // read as: "time intervals up to the visibleTime threshold yield this tickInterval and tickFormat"
      {
        tickInterval: interval.weeks(1),
        tickFormat: '%a %b %d',
        visibleTime: interval.weeks(4), // upper limit (minimum zoom)
      },
      {
        tickInterval: interval.weeks(1),
        tickFormat: '%a %b %d',
        visibleTime: interval.weeks(1),
      },
      {
        tickInterval: interval.days(1),
        tickFormat: '%a %d', // Wed 28
        visibleTime: interval.days(3),
      },
      {
        tickInterval: interval.hours(12),
        tickFormat: ' %a %p %d', // Wed PM 28
        visibleTime: interval.hours(36),
      },
      {
        tickInterval: interval.hours(8),
        tickFormat: '%a %-I %p',
        visibleTime: interval.hours(24),
      },
      {
        tickInterval: interval.hours(4),
        tickFormat: '%a %-I %p',
        visibleTime: interval.hours(12),
      },
      {
        tickInterval: interval.hours(2),
        tickFormat: '%a %-I %p',
        visibleTime: interval.hours(4),
      },
      {
        tickInterval: interval.hours(1),
        tickFormat: '%a %-I %p', // Wed 11 AM
        visibleTime: interval.hours(2),
      },
      {
        tickInterval: interval.minutes(30),
        tickFormat: '%-I:%M %p', // 11:00 AM
        visibleTime: interval.hours(1),
      },
      {
        tickInterval: interval.minutes(10),
        tickFormat: '%-I:%M %p',
        visibleTime: interval.minutes(30),
      },
      {
        tickInterval: interval.minutes(5),
        tickFormat: '%-I:%M %p',
        visibleTime: interval.minutes(10),
      },
      {
        tickInterval: interval.minutes(2),
        tickFormat: '%-I:%M %p',
        visibleTime: interval.minutes(5),
      },
      {
        tickInterval: interval.minutes(1),
        tickFormat: '%-I:%M %p',
        visibleTime: interval.minutes(2),
      },
      {
        tickInterval: interval.seconds(30),
        tickFormat: '%-I:%M:%S', // 11:20:10
        visibleTime: interval.minutes(1),
      },
      {
        tickInterval: interval.seconds(10),
        tickFormat: '%-I:%M:%S',
        visibleTime: interval.seconds(30),
      },
      {
        tickInterval: interval.seconds(5),
        tickFormat: '%-I:%M:%S',
        visibleTime: interval.seconds(8),
      },
      {
        tickInterval: interval.seconds(1),
        tickFormat: '%-I:%M:%S',
        visibleTime: interval.seconds(5), // lower limit (maximum zoom)
      },
    ],
  },
}

export default constants;
