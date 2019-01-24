// constants module
interface MapStyle {
  name: string;
  opacity: number;
  url: string;
}

const namedColors = {
  // https://clrs.cc
  aqua: '#7fdbff',
  azure: '#007fff',
  blue: '#0074d9',
  fuschia: '#f012be',
  gray: '#aaa',
  green: '#2ecc40',
  maroon: '#85144b',
  navy: '#001f3f',
  orange: '#ff851b',
  purple: '#b10dc9',
  red: '#ff4136',
  silver: '#ddd',
  teal: '#39cccc',
  yellow: '#ffdc00',

  darkerGray: '#888',
}

const mapButtonOffset = 2;
const mapButtonOpacity = 0.5;
const mapButtonSize = 50;
const timelineHeight = 150;

const constants = {
  appName: 'Pathify',
  colors: {
    appBackground: namedColors.navy,
    appText: 'black',
    byName: namedColors, // all of them
    compassButton: {
      background: 'white',
      icon: 'black',
      underlay: namedColors.purple,
    },
    followMeButton: {
      background: { active: namedColors.blue, inactive: 'black' },
      icon: { active: 'black', inactive: 'azure' },
      underlay: namedColors.azure,
    },
    geolocationButton: {
      background: 'white',
      icon: 'black',
      underlay: namedColors.green,
    },
    helpButton: {
      background: 'white',
      icon: 'black',
      underlay: namedColors.yellow,
    },
    settingsButton: {
      background: 'white',
      icon: 'black',
      underlay: namedColors.red,
    },
    timeline: {
      axis: namedColors.darkerGray,
      axisLabels: namedColors.gray,
      background: namedColors.navy,
      bars: [
        namedColors.red,
        namedColors.orange,
        namedColors.yellow,
        namedColors.purple,
      ],
    },
    user: namedColors.azure,
  },
  compassButton: {
    bottomOffset: 120,
    rightOffset: mapButtonOffset,
    mapHeadingThreshold: 1, // (unit: degrees) minimum map heading/bearing required to show CompassButton
    opacity: mapButtonOpacity,
    size: mapButtonSize,
  },
  followMeButton: {
    bottomOffset: mapButtonSize,
    opacity: mapButtonOpacity,
    rightOffset: mapButtonOffset,
    size: mapButtonSize,
  },
  geolocationButton: {
    bottomOffset: timelineHeight + mapButtonSize,
    leftOffset: mapButtonOffset,
    opacity: mapButtonOpacity,
    size: mapButtonSize,
  },
  helpButton: {
    opacity: mapButtonOpacity,
    rightOffset: mapButtonOffset,
    size: mapButtonSize,
    topOffset: mapButtonOffset,
  },
  map: {
    default: {
      lat: 47.6603810, // Wallingford
      lon: -122.3336650,
      style: 'Default',
      zoom: 14,
    },
    reorientationTime: 500, // msec
  },
  mapStyles: {
    Default: { name: 'Pathify Default', url: 'mapbox://styles/jdubman/cjgsnrhnz000d2rqkgscnpycp', opacity: 1 } as MapStyle,
    Dark: { name: 'Pathify Dark', url: 'mapbox://styles/jdubman/cjgsnuof2000q2rpqejq83nq0', opacity: 1 } as MapStyle,
    Satellite: { name: 'Satellite', url: 'mapbox://styles/jdubman/cjgsp7p4g00102rs3w4wcr655', opacity: 1 } as MapStyle,
  },
  settingsButton: {
    leftOffset: mapButtonOffset,
    opacity: mapButtonOpacity,
    size: mapButtonSize,
    topOffset: mapButtonOffset,
  },
  timeline: {
    barHeight: 20,
    bottomPaddingForAxis: 33, // TODO empirically determined so as not to cut off the horizontal (time) axis
    bottomPaddingForBars: 2,
    height: timelineHeight,
    tickCount: 5, // target number of ticks on the axis (approximate)
    tickLabelFontSize: 12, // anything smaller is hard to read; anything bigger takes up too much room
  },
}

export default constants;
