// constants module

import SafeAreaView from 'react-native-safe-area-view-with-get-inset';
const getInset = (SafeAreaView as any).getInset;
const safeAreaTop =  getInset('top');
const safeAreaBottom = getInset('bottom');
const bottomPaddingForAxis = safeAreaBottom ? 28 : 14; // empirically optimized for displays with/without home button

export interface GeolocationModeChoice {
  id: number;
  name: string;
}

export interface MapStyle {
  name: string;
  opacity: number;
  url: string; // Mapbox style
}

const namedColors = { // note: each must be 6 digits for withOpacity; avoid 3 digit abbreviation
  // https://clrs.cc
  aqua: '#7fdbff',
  azure: '#007fff',
  blue: '#0074d9',
  fuschia: '#f012be',
  gray: '#aaaaaa',
  green: '#2ecc40',
  maroon: '#85144b',
  navy: '#001f3f',
  orange: '#ff851b',
  purple: '#b10dc9',
  red: '#ff4136',
  silver: '#dddddd',
  teal: '#39cccc',
  yellow: '#ffdc00',

  darkerGray: '#888888',
  black: '#000000',
  white: '#ffffff',
}

const colorThemes = {
  background: namedColors.navy,
  settings: namedColors.red,
  geolocation: namedColors.azure,
}

const buttonOffset = 6;
const buttonSize = 50;
const defaultOpacity = 0.65;
const mapLogoHeight = 34; // mapbox logo
const initialTimelineHeight = 100; // thinking 150 max
const panelWidth = 252; // fits on iPhone SE
const clockHeight = 70;
const clockMargin = 4;

// helper: pad with zeros as needed
const zeroPrefix = (s: string) => (s.length ? (s.length == 1 ? '0' + s : s) : '00')
// helper: dec should be between 0 and 1; e.g. 0.8 => 'cc'
const dec1ToHexFF = (dec: number) => zeroPrefix(Math.round(dec * 255).toString(16));

const withOpacity = (color: string, opacity: number): string => (color + dec1ToHexFF(opacity)); // 0 <= opacity <= 1

const timeInterval = { // in msec
  oneSecond: 1000,
  oneMinute: 1000 * 60,
  oneHour:   1000 * 60 * 60,
  oneDay:    1000 * 60 * 60 * 24,

  seconds: (n: number) => timeInterval.oneSecond * n,
  minutes: (n: number) => timeInterval.oneMinute * n,
  hours: (n: number) => timeInterval.oneHour * n,
  days: (n: number) => timeInterval.oneDay * n,
}

const colors = {
  appBackground: colorThemes.background,
  appText: 'black',
  byName: namedColors, // all of them
  clock: {
    background: withOpacity(namedColors.black, 0.5),
    border: withOpacity(namedColors.azure, 0.5),
    underlay: withOpacity(namedColors.purple, 0.5),
  },
  compassButton: {
    background: 'white',
    icon: 'black',
    underlay: namedColors.purple,
  },
  followMeButton: {
    background: { active: namedColors.blue, inactive: 'black' },
    icon: { active: 'black', inactive: namedColors.azure },
    underlay: namedColors.azure,
  },
  geolocationButton: {
    background: 'white',
    icon: 'black',
    underlay: colorThemes.geolocation,
  },
  geolocationPanel: {
    background: withOpacity(colorThemes.background, defaultOpacity),
    border: colorThemes.geolocation,
    choiceUnderlay: withOpacity(colorThemes.geolocation, 0.5),
  },
  helpButton: {
    background: 'white',
    icon: 'black',
    underlay: namedColors.yellow,
  },
  refTime: {
    background: withOpacity(namedColors.navy, 0.75),
    hoursMinutes: namedColors.white,
    seconds: withOpacity(namedColors.white, 0.75),
    msec: withOpacity(namedColors.white, 0), // TODO show sometimes
    subText: withOpacity(namedColors.white, 0.75),
    underlay: withOpacity(namedColors.gray, 0.5),
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
    bars: [
      withOpacity(namedColors.green, 0.35),
      withOpacity(namedColors.green, 0.55),
    ],
    centerLine: withOpacity(namedColors.white, 0.5),
    topLine: withOpacity(namedColors.gray, 0.5),
  },
  user: namedColors.azure,
}

// --------------------------------------------------------------------------------------------------------------------

const constants = {
  appName: 'Pathify',
  buttonOffset,
  buttonSize,
  clock: {
    border: {
      width: 1,
      color: withOpacity(colors.byName.azure, 1),
    },
    centerCircle: {
      color: withOpacity(colors.byName.red, 1),
      radius: 3,
    },
    height: clockHeight, // which is also width
    margin: clockMargin,
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
      color: withOpacity(colors.byName.red, 1),
      lengthRatio: 1,
      thickness: 1,
    },
    ticks: {
      count: 60,
      major: {
        color: withOpacity(colors.byName.white, 0.65),
        length: 10,
        width: 1,
      },
      minor: {
        color: withOpacity(colors.byName.blue, 1),
        length: 5,
        width: 1,
      },
    },
  },
  colors,
  colorThemes,
  compassButton: {
    bottomOffset: mapLogoHeight + safeAreaBottom + buttonSize + buttonOffset * 2,
    rightOffset: buttonOffset,
    mapHeadingThreshold: 1, // (unit: degrees) minimum map heading/bearing required to show CompassButton
    opacity: defaultOpacity,
    size: buttonSize,
  },
  days: [
    'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'
  ],
  followMeButton: {
    bottomOffset: mapLogoHeight + safeAreaBottom,
    opacity: defaultOpacity,
    rightOffset: buttonOffset,
    size: buttonSize,
  },
  fonts: {
    colors: {
      default: 'white',
    },
    sizes: {
      choice: 15,
      choiceLabel: 12,
    },
  },
  geolocationButton: {
    bottomOffset: safeAreaBottom + mapLogoHeight,
    leftOffset: buttonOffset,
    opacity: defaultOpacity,
    size: buttonSize,
  },
  geolocationModeChoices: [
    { id: 0, name: '0' },
    { id: 1, name: '1' },
    { id: 2, name: '2' },
    { id: 3, name: '3' },
  ] as GeolocationModeChoice[],
  geolocationPanel: {
    height: 300,
    leftOffset: buttonOffset,
    bottomOffset: safeAreaBottom + mapLogoHeight,
  },
  helpButton: {
    opacity: defaultOpacity,
    rightOffset: buttonOffset,
    size: buttonSize,
    topOffset: safeAreaTop + buttonOffset,
  },
  map: {
    default: {
      lat: 47.6603810, // Wallingford
      lon: -122.3336650,
      style: 'Default', // e.g. None, Default, Topo, Satellite. See mapStyles name
      zoom: 14,
    },
    opacityUnderPanels: defaultOpacity, // TODO adjust
    reorientationTime: 500, // msec
  },
  mapStyles: [
    { name: 'None', opacity: 1, url: '' },
    { name: 'Default', opacity: 1, url: 'mapbox://styles/jdubman/cjgsnrhnz000d2rqkgscnpycp' },
    { name: 'Topo', opacity: 1, url: 'mapbox://styles/jdubman/cjgsnuof2000q2rpqejq83nq0' },
    { name: 'Satellite', opacity: 1, url: 'mapbox://styles/jdubman/cjgsp7p4g00102rs3w4wcr655' },
  ] as MapStyle[],
  months: [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ],
  panelWidth,
  refTime: {
    bottomMargin: 5,
    height: 44,
    leftContentsWidth: 60,
    width: 126,
  },
  safeAreaBottom,
  safeAreaTop,
  serverSyncIntervalDefault: 10000, // msec
  settingsButton: {
    leftOffset: buttonOffset,
    opacityWhenClosed: defaultOpacity,
    opacityWhenOpen: 1,
    size: buttonSize,
    topOffset: safeAreaTop + buttonOffset,
  },
  settingsPanel: {
    height: 300, // tallest it can be without covering up Geolocation button on iPhone SE with Timeline showing
    leftOffset: buttonOffset,
    subpanelLeftOffset: buttonOffset,
    subpanelTopOffset: buttonSize + buttonOffset,
    topOffset: safeAreaTop + buttonOffset,
  },
  timeline: {
    barHeight: 44,
    bottomPaddingForAxis,
    bottomPaddingForBars: 0,
    centerLineWidth: 3,
    initialHeight: initialTimelineHeight,
    initialSpan: timeInterval.minutes(1),
    tickCount: 5, // target number of ticks on the axis (approximate)
    tickLabelFontSize: 12, // smaller is hard to read; bigger takes up too much room
    topLineHeight: 1,
  },
}

export default constants;
