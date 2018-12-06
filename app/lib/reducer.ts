import constants from 'lib/constants';

const initialAppState = {
  options: {
    mapStyle: constants.map.default.style,
  },
} as any;

const Reducer = (state = initialAppState, action: any) => {
  const newState = { ...state }; // shallow copy for now
  return newState;
}

export default Reducer;
