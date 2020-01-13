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
  'FUTURE' = 'FUTURE',
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

  black: '#000000',
  brightGreen: '#08f222',
  darkerGray: '#888888',
  darkGreen: '#239c31',
  darkerGreen: '#035a0d',
  darkRed: '#bf0a00',
  darkerRed: '#840700',
  lighterBlue: '#77c0ff',
  white: '#ffffff',
}

// colorThemes is pretty simple right now; just colors that are reused
const colorThemes = {
  background: namedColors.black,
  help: namedColors.yellow,
  now: namedColors.green,
  nowDark: namedColors.darkGreen,
  nowDarker: namedColors.darkerGreen,
  past: namedColors.blue,
  settings: namedColors.darkerGray,
  topMenu: namedColors.darkerGray,
}

// For Realm database
const schemaVersion = 21;

const buttonOffset = 6;
const buttonSize = 50;
const defaultOpacity = 0.65;
const fontFamily = 'Futura';
const mapLogoHeight = 34; // mapbox logo
const minDeviceWidth = 320; // iPhone SE
const initialTimelineHeight = 90;
const panelWidth = 252; // fits on iPhone SE
const panelHeight = 315; // fits on iPhone SE with Timeline showing (if Timeline 90)
const scrollbarHeight = 8; // for ActivityList horizontal scrollbar below activities
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
    // itemBackground_current: withOpacity(colorThemes.now, 0.5),
    // itemBackground_selected: withOpacity(namedColors.azure, 0.5),
  },
  activityInfo: {
    background: withOpacity(namedColors.silver, 0),
  },
  activityList: {
    background: 'transparent',
    backgroundMargin: withOpacity(namedColors.white, 0.3),
    current: {
      background: withOpacity(colorThemes.now, 0.3),
      border: withOpacity(colorThemes.now, 1),
      underlay: withOpacity(colorThemes.now, 0.35),
    },
    past: {
      background: withOpacity(namedColors.darkerGray, 0.25),
      backgroundSelected: withOpacity(colorThemes.past, 0.75),
      border: withOpacity(namedColors.gray, 0.5),
      borderSelected: withOpacity(namedColors.lighterBlue, 0.5),
      selected: withOpacity(colorThemes.past, 0.5),
      underlay: withOpacity(colorThemes.past, 0.65),
    },
    text: withOpacity(namedColors.white, 0.75),
    textSelected: withOpacity(namedColors.white, 1),
  },
  appBackground: colorThemes.background,
  appText: 'black',
  byName: namedColors, // all of them
  clock: {
    background: withOpacity(namedColors.black, 0.7),
    border: withOpacity(namedColors.azure, 0.9),
    backgroundNow: withOpacity(colorThemes.nowDark, 0.65),
    backgroundPast: withOpacity(namedColors.azure_dark, 0.75),
    backgroundStopped: withOpacity(namedColors.black, 0.7),
    backgroundStoppedPast: withOpacity(namedColors.darkRed, 0.7),
    underlay: withOpacity(namedColors.black, 0.5),
  },
  clockMenu: {
    background: withOpacity(colorThemes.background, defaultOpacity),
    border: namedColors.darkerGray,
  },
  compassButton: {
    background: 'white',
    icon: 'black',
    underlay: withOpacity(namedColors.purple, 1),
  },
  debugInfo: {
    backgroundColor: withOpacity(namedColors.black, 0.65),
    borderColor: withOpacity(namedColors.gray, 0.2),
    borderWidth: 2,
    text: 'white',
  },
  followMeButton: {
    background: { active: colorThemes.nowDark, inactive: 'black' },
    icon: { active: 'black', inactive: colorThemes.now },
    underlay: colorThemes.now,
  },
  geolocationButton: {
    background: 'white',
    opacity: 0.75,
    disabledBackground: namedColors.green,
    disabledUnderlay: namedColors.brightGreen, // in transition
    enabledBackground: namedColors.darkRed,
    enabledUnderlay: namedColors.red, // in transition
  },
  helpButton: {
    background: 'white',
    icon: 'black',
    underlay: colorThemes.help,
  },
  helpPanel: {
    background: withOpacity(colorThemes.background, defaultOpacity),
    border: namedColors.darkerGray,
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
  scrollTime: {
    background: withOpacity(namedColors.navy, 0.75),
    hoursMinutes: namedColors.white,
    seconds: withOpacity(namedColors.white, 0.75),
    msec: withOpacity(namedColors.white, 0), // TODO show sometimes?
    subText: withOpacity(namedColors.white, 0.75),
    underlay: 'transparent',
  },
  paths: {
    transparent: 'transparent',
    current: withOpacity(colorThemes.now, 0.75),
    default: withOpacity(namedColors.blue, 0.75),
  },
  pulsars: {
    userLocation: withOpacity(colorThemes.now, 1),
    priorLocation: withOpacity(namedColors.blue, 1),
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
  switch: {
    background: withOpacity(namedColors.darkerGray, 0.5),
    thumb: withOpacity(namedColors.green, 1),
    track: {
      false: withOpacity(namedColors.black, 1),
      true: withOpacity(namedColors.blue, 0.75),
    }
  },
  timeline: {
    axis: namedColors.darkerGray,
    axisLabels: namedColors.gray,
    background: colorThemes.background,
    currentActivity: withOpacity(colorThemes.now, 0.75),
    selectedActivity: withOpacity(namedColors.blue, 0.75), // special case when timespan is selected
    timespans: {
      [TimespanKind.ACTIVITY]: withOpacity(namedColors.white, 0.4), // unselected state (selectedActivity color above)
      [TimespanKind.APP_STATE]: namedColors.white, // opacity applied later
      [TimespanKind.FUTURE]: withOpacity(namedColors.silver, 0.15),
      [TimespanKind.LOCATIONS]: withOpacity(namedColors.blue, 0.35),
      [TimespanKind.OTHER]: withOpacity(namedColors.darkRed, 0.35),
      [TimespanKind.MODE]: withOpacity(namedColors.fuschia, 0.25), // TODO
      [TimespanKind.MOTION]: withOpacity(namedColors.yellow, 0.25), // TODO
      [TimespanKind.SELECTION]: withOpacity(namedColors.white, 0.25), // spans the whole timeline vertically
    },
    centerLine: withOpacity(namedColors.white, 0.5),
    topLine: withOpacity(namedColors.gray, 0.5),
  },
  topButton: {
    background: 'white',
    backgroundCurrentSelected: withOpacity(colorThemes.now, 1),
    backgroundSelected: withOpacity(colorThemes.past, 1),
    border: withOpacity(namedColors.silver, 0.65),
    borderSelected: withOpacity(namedColors.lighterBlue, 0.5),
    bubble: withOpacity(namedColors.darkerGray, 1),
    bubbleNow: withOpacity(colorThemes.now, 1),
    bubblePast: withOpacity(colorThemes.past, 1),
    bubbleLabel: 'white',
    icon: 'black',
    iconSelected: 'white',
    underlay: colorThemes.topMenu,
  },
  topMenu: {
    background: withOpacity(colorThemes.background, defaultOpacity),
    border: namedColors.darkerGray,
  },
  user: colorThemes.now,
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
  activityInfo: {
    height: 200,
    sideMargin: 5,
    topOffset: safeAreaTop,
  },
  activityList: {
    activityHeight: initialTimelineHeight,
    activityMargin: (buttonOffset + 2) * 2, // applied on left
    activityWidth: initialTimelineHeight, // < minDeviceWidth / 3
    borderRadius: 0,
    borderWidth: 1,
    height: initialTimelineHeight + scrollbarHeight,
    scrollbarHeight,
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
    height: panelHeight,
    width: minDeviceWidth - (buttonSize + buttonOffset) * 2 - buttonOffset,
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
  database: {
    schemaVersion,
  },
  days: [
    'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'
  ],
  debugInfo: {
    borderWidth: 2,
    height: 200,
    padding: 5,
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
  helpPanel: {
    height: panelHeight,
    rightOffset: buttonOffset,
    subpanelTopOffset: buttonSize + buttonOffset,
    topOffset: safeAreaTop,
  },
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  map: {
    centerMapDuration: 500, // TODO not honored on iOS https://github.com/nitaliano/react-native-mapbox-gl/issues/1411
    default: {
      bounds: [ // TODO this is basically North America
        [68.45269397608266, -0.16697147646779342],
        [-66.41460411107224, -132.09348845123324],
      ],
      heading: 0,
      opacity: 0.5,
      style: 'Satellite', // e.g. None, Trails, Topo, Satellite. See mapStyles.name
      zoom: 10, // TODO still needed?
      zoomStartActivity: 16,
    },
    fitBounds: {
      duration: 500,
      minHorizontalPadding: 20,
      minVerticalPadding: 20,
    },
    opacityUnderPanels: defaultOpacity, // TODO adjust
    reorientationTime: interval.seconds(1) / 2,
  },
  mapLogoHeight,
  mapStyles: [
    { name: 'None', opacity: 1, url: '' },
    { name: 'Trails', opacity: 1, url: 'mapbox://styles/jdubman/cjgsnrhnz000d2rqkgscnpycp' },
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
  maxLogsToTransmit: 1000,
  maxTimeGapForContinuousTrack: interval.seconds(5),
  months: [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ],
  minDeviceWidth,
  nowButton: {
    iconSize: clockHeight - 8,
    margin: clockMargin,
  },
  panelHeight,
  panelWidth,
  paths: {
    metersAccuracyRequired: 30,
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
    height: panelHeight,
    leftOffset: buttonOffset,
    subpanelTopOffset: buttonSize + buttonOffset,
    topOffset: safeAreaTop,
  },
  timing: { // msec
    activityListAnimationCompletion: 600,
    activityRefreshDelay: 1000, // TODO
    menuFade: 300,
    opacitySliderThrottle: 50,
    pulsarPulse: 1000,
    scrollViewWaitForMomentumScroll: 20, // TODO2
    timelineCloseToNow: 1000,
    timelineZoomThrottle: 100,
    timerTickInterval: 1000, // once per second
  },
  timeline: {
    activityZoomFactor: 1.25, // 1 means zoom Timeline to exact duration of Activity. Should be somewhat >1 for context.
    barHeight: 40, // big enough to be touchable
    bottomPaddingForAxis,
    bottomPaddingForBars: 0,
    centerLineWidth: 3,
    default: {
      height: initialTimelineHeight + bottomPaddingForAxis,
      zoomValue: 0.64, // between 0 (min zoom) and 1 (max zoom) relative to zoomLevels below (0.64 is a good default)
    },
    miniBarHeight: 15,
    minimumZoomMsec: 1000, // 1 second
    nearTimeThreshold: interval.minutes(5), // TODO
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
  topButton: {
    fontFamily,
    fontSize: 12,
    opacity: defaultOpacity,
    opacitySelected: 0.8,
    size: buttonSize,
  },
  topMenu: {
    height: panelHeight,
    subpanelTopOffset: buttonSize + buttonOffset,
    topOffset: safeAreaTop,
    width: minDeviceWidth - (buttonSize + buttonOffset) * 2 - buttonOffset,
  },
}

export default constants;
