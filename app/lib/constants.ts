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
  'locations' = 'locations',
  'other' = 'other',
  'selection' = 'selection'
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
}

const buttonOffset = 6;
const buttonSize = 50;
const defaultOpacity = 0.65;
const mapLogoHeight = 34; // mapbox logo
const initialTimelineHeight = 120; // thinking 150 max
const panelWidth = 252; // fits on iPhone SE
const clockHeight = 70;
const clockMargin = 4;

// helper: pad with zeros as needed
const zeroPrefix = (s: string) => (s.length ? (s.length == 1 ? '0' + s : s) : '00')
// helper: dec should be between 0 and 1; e.g. 0.8 => 'cc'
const dec1ToHexFF = (dec: number) => zeroPrefix(Math.round(dec * 255).toString(16));

const withOpacity = (color: string, opacity: number): string => (color + dec1ToHexFF(opacity)); // 0 <= opacity <= 1

const colors = {
  appBackground: colorThemes.background,
  appText: 'black',
  byName: namedColors, // all of them
  clock: {
    background: withOpacity(namedColors.black, 0.5),
    border: withOpacity(namedColors.azure, 0.7),
    underlay: withOpacity(namedColors.blue, 0.5),
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
    // icon: 'black',
    opacity: 0.75,
    disabledBackground: namedColors.green,
    disabledUnderlay: namedColors.yellow, // in transition
    enabledBackground: namedColors.red,
    enabledUnderlay: namedColors.orange, // in transition
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
    timespans: {
      [TimespanKind.locations]: withOpacity(namedColors.green, 0.35),
      [TimespanKind.other]: withOpacity(namedColors.azure, 0.35),
      [TimespanKind.selection]: withOpacity(namedColors.white, 0.25),

    },
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
  clientId,
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
  helpButton: {
    opacity: defaultOpacity,
    rightOffset: buttonOffset,
    size: buttonSize,
    topOffset: safeAreaTop + buttonOffset,
  },
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  map: {
    centerMapDuration: 500, // TODO not honored on iOS https://github.com/nitaliano/react-native-mapbox-gl/issues/1411
    // TODO fitBounds can be used instead
    default: {
      lat: 47.6603810, // Wallingford
      lon: -122.3336650,
      opacity: 1,
      style: 'Default', // e.g. None, Default, Topo, Satellite. See mapStyles name
      zoom: 14,
    },
    opacityUnderPanels: defaultOpacity, // TODO adjust
    reorientationTime: interval.seconds(1) / 2,
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
  maxTimeGapForContinuousTrack: interval.seconds(5),
  panelWidth,
  refTime: {
    bottomMargin: 5,
    height: 44,
    leftContentsWidth: 60,
    width: 126,
  },
  safeAreaBottom,
  safeAreaTop,
  serverDelayAfterFailedRequest: interval.seconds(5),
  serverUrl: 'https://pathify.app:3000/', // TODO could also be localhost:3000/
  serverSyncIntervalDefault: interval.seconds(10),
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
    barHeight: 40,
    bottomPaddingForAxis,
    bottomPaddingForBars: 0,
    centerLineWidth: 3,
    default: {
      height: initialTimelineHeight,
      zoomLevel: 1,
    },
    nearTimeThreshold: interval.minute, // TODO
    tickLabelFontSize: 12, // smaller is hard to read; bigger takes up too much room
    topLineHeight: 1,
    yDomain: [0, 10] as DomainTuple, // The nonzero quantity here is sort of arbitrary; it establishes a scale.
    zoomLevels: [
      // visibleTime is #milliseconds visible at a given time (which has no relation to refTime.)
      //
      // Note the ratios of successive pairs of intervals aims to be somewhat consistently close to 5,
      // (ranging from 3.5 to 6), rounded so they are easy to understand, like a half hour, half day, etc.
      //
      // tickFormat:  https://github.com/d3/d3-time-format/blob/master/README.md#timeFormat
      {
        // level 0: zoomed in all the way
        name: '10 seconds',
        tickInterval: interval.seconds(2), // 1/5 of visibleTime
        tickFormat: '%-I:%M:%S',
        visibleTime: interval.seconds(10), // 1/6 of default
      },
      {
        // level 1: default
        name: '1 minute',
        tickInterval: interval.seconds(10), // 1/6 of visibleTime
        tickFormat: '%-I:%M:%S',
        visibleTime: interval.minutes(1), // 4x previous visibleTime
      },
      {
        // level 2: one level zoomed out
        name: '5 minutes',
        tickInterval: interval.minutes(1), // 1/5 of visibleTime
        tickFormat: '%-I:%M %p',
        visibleTime: interval.minutes(5), // 5x previous visibleTime
      },
      {
        // level 3
        name: '30 minutes', // half hour
        tickInterval: interval.minutes(5), // 1/6 of visibleTime
        tickFormat: '%-I:%M %p',
        visibleTime: interval.minutes(30), // 6x previous visibleTime
      },
      {
        // level 4
        name: '2 hours',
        tickInterval: interval.minutes(30), // 1/4 of visibleTime
        tickFormat: '%-I:%M %p',
        visibleTime: interval.hours(2), // 4x previous visibleTime
      },
      {
        // level 5
        name: '12 hours',
        tickInterval: interval.hours(2), // 1/6 of visibleTime
        tickFormat: '%-I:%M %p',
        visibleTime: interval.hours(12), // 6x previous visibleTime
      },
      {
        // level 6
        name: '2 days',
        tickInterval: interval.hours(12), // 1/4 of visibleTime
        tickFormat: '%a %-I %p',
        visibleTime: interval.days(2), // 4x previous visibleTime
      },
      {
        // level 7
        name: '1 week',
        tickInterval: interval.days(1), // 1/7 of visibleTime
        tickFormat: '%a %d',
        visibleTime: interval.days(7), // 6x previous visibleTime
      },
      {
        // level 8
        name: '4 weeks',
        tickInterval: interval.weeks(1), // 1/4 of visibleTime
        tickFormat: '%a %b %d',
        visibleTime: interval.weeks(4), // 4x previous visibleTime
      },
    ],
  },
}

export default constants;
