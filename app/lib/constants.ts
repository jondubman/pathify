// constants module
interface MapStyle {
  url: string;
  opacity: number;
}

const constants = {
  appName: 'Pathify',
  colors: {
    appBackground: 'black',
    appText: 'black',
    user: '#007FFF',  // azure, the hue halfway between blue and cyan
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
  timeline: {
    barHeight: 20,
    bottomPaddingForAxis: 33, // TODO empirically determined so as not to cut off the horizontal (time) axis
    height: 75,
  },
}

export default constants;
