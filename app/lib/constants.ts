// constants module
import SafeAreaView from 'react-native-safe-area-view-with-get-inset';
const getInset = (SafeAreaView as any).getInset;
const safeAreaTop =  getInset('top');
const safeAreaBottom = getInset('bottom');
// const safeAreaLeft = getInset('left');
// const safeAreaRight = getInset('right');
const bottomPaddingForAxis = safeAreaBottom ? 10 : 14;

export interface GeolocationModeChoice {
  id: number;
  name: string;
}

export interface MapStyle {
  name: string;
  opacity: number;
  url: string;
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

const dec1ToHexFF = (dec: number) => Math.round(dec * 255).toString(16); // dec between 0 and 1; e.g. 0.8 => 'cc'
const withOpacity = (color: string, opacity: number): string => (color + dec1ToHexFF(opacity)); // 0 <= opacity <= 1

const colors = {
  appBackground: colorThemes.background,
  appText: 'black',
  byName: namedColors, // all of them
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
    border: withOpacity(namedColors.white, 0.5),
    hoursMinutes: namedColors.white,
    seconds: withOpacity(namedColors.gray, 1),
    msec: withOpacity(namedColors.gray, 0.5),
    subText: namedColors.gray,
    underlay: withOpacity(namedColors.maroon, 0.5),
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

const constants = {
  appName: 'Pathify',
  buttonOffset,
  buttonSize,
  colors,
  colorThemes,
  compassButton: {
    bottomOffset: mapLogoHeight + safeAreaBottom + buttonSize + buttonOffset * 2,
    rightOffset: buttonOffset,
    mapHeadingThreshold: 1, // (unit: degrees) minimum map heading/bearing required to show CompassButton
    opacity: defaultOpacity,
    size: buttonSize,
  },
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
      style: 'Topo', // None, Default, etc.
      zoom: 14,
    },
    opacityUnderPanels: defaultOpacity, // TODO adjust
    reorientationTime: 500, // msec
  },
  mapStyles: [
    { name: 'None', url: '' },
    { name: 'Default', url: 'mapbox://styles/jdubman/cjgsnrhnz000d2rqkgscnpycp' },
    { name: 'Topo', url: 'mapbox://styles/jdubman/cjgsnuof2000q2rpqejq83nq0' },
    { name: 'Satellite', url: 'mapbox://styles/jdubman/cjgsp7p4g00102rs3w4wcr655' },
  ] as MapStyle[],
  panelWidth,
  refTime: {
    bottomMargin: 5,
    height: 44,
    width: 120, // fits on iPhone SE
  },
  safeAreaBottom,
  safeAreaTop,
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
    refTimespanPadding: 100000, // msec
    tickCount: 5, // target number of ticks on the axis (approximate)
    tickLabelFontSize: 12, // smaller is hard to read; bigger takes up too much room
    topLineHeight: 1,
  },
}

export default constants;
