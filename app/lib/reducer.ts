const initialAppState = {
} as any;

const Reducer = (state = initialAppState, action: any) => {
  const newState = { ...state }; // shallow copy for now
  return newState;
}

export default Reducer;
