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
    rightOffset: 2,
    mapHeadingThreshold: 1, // (unit: degrees) minimum map heading/bearing required to show CompassButton
    opacity: 0.7,
    size: 50,
  },
  followMeButton: {
    bottomOffset: 50,
    opacity: 0.7,
    rightOffset: 2,
    size: 50,
  },
  geolocationButton: {
    bottomOffset: timelineHeight + 50,
    leftOffset: 2,
    opacity: 0.7,
    size: 50,
  },
  helpButton: {
    opacity: 0.7,
    size: 50,
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
    opacity: 0.7,
    size: 50,
  },
  timeline: {
    barHeight: 20,
    bottomPaddingForAxis: 33, // TODO empirically determined so as not to cut off the horizontal (time) axis
    bottomPaddingForBars: 2,
    height: timelineHeight,
    tickCount: 5,
    tickLabelFontSize: 12,
  },
}

export default constants;
