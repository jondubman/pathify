// constants module
interface MapStyle {
  url: string;
  opacity: number;
}

const constants = {
  colors: {
    appBackground: 'blue',
    appText: 'white',
  },
  map: {
    default: {
      lat: 47.6603810, // Wallingford
      lon: -122.3336650,
      style: 'Dark',
      zoom: 14,
    },
  },
  mapStyles: {
    Default: { url: 'mapbox://styles/jdubman/cjgsnrhnz000d2rqkgscnpycp', opacity: 1 } as MapStyle,
    Dark: { url: 'mapbox://styles/jdubman/cjgsnuof2000q2rpqejq83nq0', opacity: 1 } as MapStyle,
    Satellite: { url: 'mapbox://styles/jdubman/cjgsp7p4g00102rs3w4wcr655', opacity: 1 } as MapStyle,
  },
}

export default constants;
