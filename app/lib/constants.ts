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
  darkerYellow: '#ffdc00',
  lighterBlue: '#77c0ff',
  white: '#ffffff',
}

// colorThemes is pretty simple right now; just colors that are reused
const colorThemes = {
  background: namedColors.black,
  help: namedColors.yellow,
  now: namedColors.green,
  nowSelected: namedColors.azure,
  nowSelectedDark: namedColors.azure_dark,
  nowDark: namedColors.darkGreen,
  nowDarker: namedColors.darkerGreen,
  past: namedColors.blue,
  settings: namedColors.darkerGray,
  topMenu: namedColors.darkerGray,
}

// For Realm database. Very meaningful to Realm! This MUST be increased whenever any of the DB schemas are updated.
// It is stored along with such things as Activity and Path, which may not get migrated instantly when schema is updated
// as that could take a long time. Migration may be deferred and gradual to make the performance hit less noticeable.
const schemaVersion = 29;

// constants that are reused when defining other constants:
const activityListMargin = 16;
const activityTopBottomBorderHeight = 5;
const borderRadiusSmall = 5;
const bottomButtonSpacing = 12;
const buttonOffset = 6;
const buttonSize = 50;
const defaultOpacity = 0.65;
const fontFamily = 'Futura';
const mapLogoHeight = 34; // Mapbox logo
const menuBorderWidth = 1.5;
const minDeviceWidth = 320; // minimum design width; iPhone SE
const initialTimelineHeight = 90;
const panelWidth = 252; // fits on iPhone SE
const panelHeight = 315; // fits on iPhone SE with Timeline showing (if Timeline 90)
const scrollbarHeight = 8; // for ActivityList horizontal scrollbar below activities
const clockHeight = 70;

// helper: pad with zeros as needed
const zeroPrefix = (s: string) => (s.length ? (s.length === 1 ? '0' + s : s) : '00')
// helper: dec should be between 0 and 1; e.g. 0.8 => 'cc'
const dec1ToHexFF = (dec: number) => zeroPrefix(Math.round(dec * 255).toString(16));

// 0 <= opacity <= 1
export const withOpacity = (color: string, opacity: number): string => (color + dec1ToHexFF(opacity));

const colors = {
  activityDetails: {
    backgroundCurrentNow: withOpacity(colorThemes.now, 0.25),
    backgroundCurrentSelected: withOpacity(colorThemes.nowSelected, 0.5),
    backgroundPast: withOpacity(colorThemes.past, 0.35),
    bigFont: withOpacity(namedColors.white, 1),
    border: withOpacity(namedColors.white, 0.75),
    labelFont: withOpacity(namedColors.white, 0.75),
  },
  activityList: {
    background: 'transparent',
    backgroundMarginPast: withOpacity(namedColors.gray, 0.25),
    backgroundMarginFuture: withOpacity(namedColors.green, 0.25),
    borderLine: withOpacity(namedColors.gray, 0.5),
    centerLine: withOpacity(namedColors.white, 0.35),
    centerLineBright: withOpacity(namedColors.white, 0.65),
    centerLineCurrent: withOpacity(colorThemes.now, 0.75),
    centerLineSelected: withOpacity(colorThemes.past, 0.75),
    current: {
      background: withOpacity(colorThemes.now, 0.3),
      border: withOpacity(colorThemes.now, 1),
      underlay: withOpacity(colorThemes.now, 0.35),
    },
    futureZoneUnderlay: withOpacity(colorThemes.now, 0.35),
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
  appText: namedColors.black,
  byName: namedColors, // all of them
  clock: {
    background: withOpacity(namedColors.black, 0.7),
    backgroundNow: withOpacity(colorThemes.nowDark, 0.65),
    backgroundPast: withOpacity(namedColors.black, 0.75),
    backgroundPastSelected: withOpacity(colorThemes.nowSelectedDark, 0.75),
    backgroundPastCurrent: withOpacity(colorThemes.nowSelected, 0.75),
    backgroundStopped: withOpacity(namedColors.yellow, 0.65), // debug-only
    backgroundStoppedPast: withOpacity(namedColors.darkRed, 0.65), // debug-only
    underlay: 'transparent',
  },
  compassButton: {
    background: withOpacity(namedColors.white, defaultOpacity),
    icon: namedColors.black,
    underlay: withOpacity(namedColors.purple, defaultOpacity),
  },
  followButtons: {
    backgroundPath: { active: colorThemes.past, inactive: namedColors.black },
    backgroundUser: { active: colorThemes.nowDark, inactive: namedColors.black },
    iconFollowPath: { active: namedColors.white, inactive: colorThemes.past },
    iconFollowUser: { active: namedColors.white, inactive: colorThemes.now },
    underlayPath: 'transparent',
    underlayUser: 'transparent',
  },
  grabBar: {
    line: withOpacity(namedColors.silver, 0.20),
    lineActive: withOpacity(namedColors.orange, 1),
},
  helpButton: {
    background: namedColors.white,
    icon: namedColors.black,
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
  paths: {
    transparent: 'transparent',
    current: withOpacity(colorThemes.now, 0.75),
    default: withOpacity(namedColors.blue, 0.75),
  },
  pulsars: {
    userLocation: withOpacity(colorThemes.now, 1),
    pastLocation: withOpacity(namedColors.blue, 1),
  },
  refTime: {
    background: withOpacity(namedColors.navy, 0.75),
    hoursMinutes: namedColors.white,
    seconds: withOpacity(namedColors.white, 0.75),
    msec: 'transparent',
    subText: withOpacity(namedColors.white, 0.75),
    underlay: 'transparent',
  },
  settingsButton: {
    background: namedColors.white,
    icon: namedColors.black,
    underlay: colorThemes.settings,
  },
  settingsPanel: {
    background: withOpacity(colorThemes.background, defaultOpacity),
    border: colorThemes.settings,
    choiceUnderlay: withOpacity(colorThemes.settings, 0.5),
    opacitySliderBackground: withOpacity(colorThemes.settings, 0.3),
  },
  startButton: {
    opacity: 0.75,
    disabledBackground: namedColors.green,
    disabledUnderlay: namedColors.brightGreen, // in transition
    enabledBackground: namedColors.yellow,
    enabledUnderlay: namedColors.darkerYellow, // in transition
  },
  startMenu: {
    border: namedColors.darkerGray,
    buttonBackground: withOpacity(namedColors.gray, 0.25),
    dimmerBackground: withOpacity(colorThemes.background, defaultOpacity),
    menuItemBackground: 'transparent',
    menuItemUnderlay: withOpacity(namedColors.white, 0.5),
    panelBackground: withOpacity(namedColors.black, 1),
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
      [TimespanKind.FUTURE]: withOpacity(namedColors.green, 0.25),
      [TimespanKind.LOCATIONS]: withOpacity(namedColors.blue, 0.35),
      [TimespanKind.OTHER]: withOpacity(namedColors.darkRed, 0.35),
      [TimespanKind.MODE]: withOpacity(namedColors.fuschia, 0.25), // TODO
      [TimespanKind.MOTION]: withOpacity(namedColors.yellow, 0.25), // TODO
      [TimespanKind.SELECTION]: withOpacity(namedColors.white, 0.25), // spans the whole timeline vertically
    },
    centerLine: withOpacity(namedColors.white, 0.5),
    centerLineInert: withOpacity(namedColors.white, 0.25),
    centerLineZoom: withOpacity(namedColors.orange, 1),
    topLine: withOpacity(namedColors.gray, 0.5),
  },
  topButton: {
    background: namedColors.white,
    backgroundCurrentSelected: withOpacity(colorThemes.now, 1),
    backgroundSelected: withOpacity(colorThemes.past, 1),
    border: withOpacity(namedColors.silver, 0.65),
    borderSelected: withOpacity(namedColors.lighterBlue, 0.5),
    bubble: withOpacity(namedColors.darkerGray, 1),
    bubbleNow: withOpacity(colorThemes.now, 1),
    bubblePast: withOpacity(colorThemes.past, 1),
    bubbleLabel: namedColors.white,
    icon: namedColors.black,
    iconSelected: namedColors.white,
    underlay: withOpacity(namedColors.black, 1),
  },
  topMenu: {
    border: namedColors.darkerGray,
    buttonBackground: withOpacity(namedColors.gray, 0.25),
    dimmerBackground: withOpacity(colorThemes.background, defaultOpacity),
    menuItemBackground: 'transparent',
    menuItemUnderlay: withOpacity(namedColors.white, 0.5),
    panelBackground: withOpacity(namedColors.black, 1),
  },
  user: colorThemes.now,
  zoomClock: {
    border: withOpacity(namedColors.orange, 1),
  }
}

// --------------------------------------------------------------------------------------------------------------------

const constants = {
  activityDetails: {
    bigFontSize: 32,
    borderRadius: 0,
    borderWidth: 0,
    height: 64,
    itemMarginEdges: 0,
    itemMarginBottom: 0,
    itemMarginTop: 0,
    labelFontSize: 11,
    spaceBetween: 0,
  },
  activityList: {
    activityHeight: initialTimelineHeight,
    activityMargin: activityListMargin, // applied on left of each activity
    activityWidth: initialTimelineHeight, // < minDeviceWidth / 3
    borderLineHeight: 1,
    borderRadius: borderRadiusSmall,
    borderWidth: 1,
    centerLineTop: -buttonOffset,
    centerLineWidth: 2,
    height: initialTimelineHeight + scrollbarHeight + activityTopBottomBorderHeight, // list items match timeline height
    nowClockMarginLeft: activityListMargin,
    scrollbarHeight,
    topBottomBorderHeight: activityTopBottomBorderHeight,
  },
  appName: 'Pathify',
  borderRadiusSmall,
  bottomButtonSpacing,
  buttonBaseOffsetPerRow: (buttonSize + buttonOffset * 2) + bottomButtonSpacing,
  buttonOffset,
  buttonSize,
  clientId,
  clock: {
    border: {
      width: 1.5,
      color: withOpacity(colors.byName.white, 0.85),
    },
    centerCircle: {
      color: withOpacity(colors.byName.orange, 1),
      radius: 4,
    },
    centerPoint: {
      color: withOpacity(colors.byName.white, 1),
      radius: 1,
    },
    height: clockHeight, // which is also width
    hourHand: {
      color: withOpacity(colors.byName.white, 1),
      lengthRatio: 0.6,
      thickness: 3,
    },
    minuteHand: {
      color: withOpacity(colors.byName.white, 1),
      lengthRatio: 1,
      thickness: 2,
    },
    secondHand: {
      color: withOpacity(colors.byName.orange, 1),
      lengthRatio: 1,
      thickness: 1.5,
    },
    ticks: {
      count: 60,
      major: {
        color: withOpacity(colors.byName.white, 0.75),
        length: 13,
        width: 1,
      },
      minor: {
        color: withOpacity(colors.byName.gray, 0.65),
        length: 7,
        width: 1,
      },
    },
    width: clockHeight, // Note this is not a typo. Width and height are identical because clock is round.
  },
  colors,
  colorThemes,
  compassButton: {
    leftOffset: buttonOffset,
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
  followButtons: {
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
      menuItem: 18,
    },
  },
  grabBar: {
    initialTop: -1,
    lineHeight: 2,
    spacing: 2,
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
      zoomStartActivity: 15,
    },
    fitBounds: {
      duration: 500,
      minHorizontalPadding: 20,
      minVerticalPadding: 20,
    },
    opacityUnderPanels: defaultOpacity, // TODO adjust
    reorientationTime: interval.seconds(1) / 2, // to reorient to heading 0 using CompassButton
  },
  mapLogoHeight,
  mapStyles: [
    { name: 'None', opacity: 1, url: '' }, // see flags.allowMapStyleNone
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
  months: [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ],
  minDeviceWidth,
  panelHeight,
  panelWidth,
  paths: {
    elevationUnvailable: -1000, // Meters. 0 or -1 may a legitimate elevation; needs to be stored in Realm as a number.
    metersAccuracyRequired: 40, // Locations with accuracy less than this are excluded from the Path
    width: 8,
  },
  refTime: {
    bottomMargin: 7, // leaves enough room for iOS control center access at bottom of screen when timeline hidden
    height: 65,
    leftContentsWidth: 120,
    topSpace: 12,
    width: 160 - buttonOffset * 2, // was 126, which fits on smallest device without overlap
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
  startButton: {
    leftOffset: buttonOffset,
    opacity: defaultOpacity,
    size: buttonSize,
  },
  startMenu: {
    borderWidth: menuBorderWidth,
    height: 180,
    menuItemMarginHorizontal: 10,
    menuItemMarginVertical: 20,
    width: 240,
  },
  timing: { // msec
    activityListDelayReadjustmentAfterStartup: 500, // TODO would be better not to need this
    activityListAnimationCompletion: 600,
    menuFade: 300,
    opacitySliderThrottle: 50,
    paceMeasurement: interval.seconds(20),
    pulsarPulse: 1000,
    scrollViewWaitForMomentumScroll: 20, // TODO empirically, this works well, though it seems small.
    timelineCloseToNow: 1000,
    timelineRelativeZoomStep: 20,
        // timerTickInterval: 1000, // once per second - this is good enough for the second hand on the clock - lower power.
    // The app will work fine with a one-second timerTickInterval and in fact can function almost entirely without any
    // ticks at all including recording activities as the ticks are mostly just to support timelineNow mode / now clock.
    // 50 generates buttery smooth motion of second hand on the clock, but may drop JS frame.
    // 100 is a good compromise. Above 200, the stepping motion becomes more apparent.
    timerTickInterval: 100,
    // Note that every component's mapStateToProps will be called via react-redux Connect this often, so if there are
    // any perf issues there, they will rapidly reveal themselves by lowering this interval.
    vibration: 400, // TODO ignored on iOS?
  },
  timeline: {
    activityZoomFactor: 1.25, // 1 means zoom Timeline to exact duration of Activity. Should be somewhat >1 for context.
    barHeight: 40, // big enough to be touchable
    bottomPaddingForAxis,
    bottomPaddingForBars: 0,
    centerLineWidth: 3,
    default: {
      height: initialTimelineHeight + bottomPaddingForAxis,
      zoomValue: 0.64, // between 0 (min zoom) and 1 (max zoom) relative to zoomRanges below (0.64 is a good default)
    },
    miniBarHeight: 15,
    minimumZoomMsec: 1000, // 1 second
    nearTimeThreshold: interval.seconds(10), // TODO
    tickLabelFontSize: 12, // smaller is hard to read; bigger takes up too much room
    topLineHeight: 1,
    widthMultiplier: 10, // >1, important for smooth panning of the timeline. Larger means harder to reach the edge.
    yDomain: [0, 10] as DomainTuple, // The nonzero quantity here is sort of arbitrary; it establishes a linear scale.
    zoomRanges: [
      // For the purpose of formatting tick marks on the Timeline axis, time intervals up to but not beyond the
      // visibleTime threshold should yield the given tickInterval and tickFormat.
      // visibleTime refers to the amount of time visible on screen (any off-screen portions of Timeline do not count.)
      //
      { // zoomRange 0
        tickInterval: interval.weeks(1),
        tickFormat: '%a %b %d',
        visibleTime: interval.weeks(4), // upper limit (minimum zoom)
      },
      { // zoomRange 1
        tickInterval: interval.weeks(1),
        tickFormat: '%a %b %d',
        visibleTime: interval.weeks(1),
      },
      { // zoomRange 2
        tickInterval: interval.days(1),
        tickFormat: '%a %d', // Wed 28
        visibleTime: interval.days(3),
      },
      { // zoomRange 3
        tickInterval: interval.hours(12),
        tickFormat: ' %a %p %d', // Wed PM 28
        visibleTime: interval.hours(36),
      },
      { // zoomLevel 4
        tickInterval: interval.hours(8),
        tickFormat: '%a %-I %p',
        visibleTime: interval.hours(24),
      },
      { // zoomRange 5
        tickInterval: interval.hours(4),
        tickFormat: '%a %-I %p',
        visibleTime: interval.hours(12),
      },
      { // zoomRange 6
        tickInterval: interval.hours(2),
        tickFormat: '%a %-I %p',
        visibleTime: interval.hours(4),
      },
      { // zoomRange 7
        tickInterval: interval.hours(1),
        tickFormat: '%a %-I %p', // Wed 11 AM
        visibleTime: interval.hours(2),
      },
      { // zoomRange 8
        tickInterval: interval.minutes(30),
        tickFormat: '%-I:%M %p', // 11:00 AM
        visibleTime: interval.hours(1),
      },
      { // zoomRange 9
        tickInterval: interval.minutes(10),
        tickFormat: '%-I:%M %p',
        visibleTime: interval.minutes(30),
      },
      { // zoomRange 10
        tickInterval: interval.minutes(5),
        tickFormat: '%-I:%M %p',
        visibleTime: interval.minutes(10),
      },
      { // zoomRange 11
        tickInterval: interval.minutes(2),
        tickFormat: '%-I:%M %p',
        visibleTime: interval.minutes(5),
      },
      { // zoomRange 12
        tickInterval: interval.minutes(1),
        tickFormat: '%-I:%M %p',
        visibleTime: interval.minutes(2),
      },
      { // zoomRange 13
        tickInterval: interval.seconds(30),
        tickFormat: '%-I:%M:%S', // 11:20:10
        visibleTime: interval.minutes(1),
      },
      { // zoomRange 14
        tickInterval: interval.seconds(10),
        tickFormat: '%-I:%M:%S',
        visibleTime: interval.seconds(30),
      },
      { // zoomRange 15
        tickInterval: interval.seconds(5),
        tickFormat: '%-I:%M:%S',
        visibleTime: interval.seconds(8),
      },
      { // zoomRange 16
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
    borderWidth: menuBorderWidth,
    menuItemMarginHorizontal: 10,
    menuItemMarginVertical: 15,
    height: 240,
    width: 240,
  },
}

export default constants;
