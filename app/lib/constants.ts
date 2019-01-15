// constants module
interface MapStyle {
  url: string;
  opacity: number;
}

const azure = '#007fff';  // azure, the hue halfway between blue and cyan

const constants = {
  appName: 'Pathify',
  colors: {
    appBackground: 'white',
    appText: 'black',
    followMeButton: {
      background: { active: 'white', inactive: 'black' },
      icon: { active: 'black', inactive: 'azure' },
      underlay: '#0074d9',
    },
    helpButton: {
      background: 'white',
      icon: 'black',
      underlay: '#2ecc40',
    },
    settingsButton: {
      background: 'white',
      icon: 'black',
      underlay: '#ff4136',
    },
    timeline: {
      axis: '#48f',
      background: '#004',
      bars: [
        'red',
        'green',
        azure,
        'yellow',
      ],
    },
    user: azure,
  },
  followMeButton: {
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
  },
  mapStyles: {
    Default: { url: 'mapbox://styles/jdubman/cjgsnrhnz000d2rqkgscnpycp', opacity: 1 } as MapStyle,
    Dark: { url: 'mapbox://styles/jdubman/cjgsnuof2000q2rpqejq83nq0', opacity: 1 } as MapStyle,
    Satellite: { url: 'mapbox://styles/jdubman/cjgsp7p4g00102rs3w4wcr655', opacity: 1 } as MapStyle,
  },
  settingsButton: {
    opacity: 0.7,
    size: 50,
  },
  timeline: {
    barHeight: 20,
    bottomPaddingForAxis: 33, // TODO empirically determined so as not to cut off the horizontal (time) axis
    bottomPaddingForBars: 2,
    height: 120,
  },
}

export default constants;
