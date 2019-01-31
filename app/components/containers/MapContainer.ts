// Note this is the container for MapArea but for brevity, it's called MapContainer instead of MapAreaContainer.

import { connect } from 'react-redux';

import { AppState } from 'lib/reducer';
import utils from 'lib/utils';

import { LocationEvent } from 'lib/geo';
import MapArea from 'components/MapArea';
import { dynamicMapHeight, dynamicMapStyle } from 'lib/selectors';

interface StateProps {
  height: number;
  mapStyleURL: string;
  opacity: number;
  width: number;
  userLoc?: LocationEvent;
}

interface DispatchProps {
}

interface OwnProps {
}

const mapStateToProps = (state: AppState, ownProps: OwnProps): StateProps => {
  const mapStyle = dynamicMapStyle(state);
  const { width } = utils.windowSize();
  return {
    height: dynamicMapHeight(state),
    mapStyleURL: mapStyle.url,
    opacity: state.options.mapOpacity,
    width,
    userLoc: state.loc,
  }
}

const mapDispatchToProps = (dispatch: any): DispatchProps => {
  const dispatchers = {
  }
  return dispatchers;
}

const MapContainer = connect<StateProps, DispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(MapArea as any);

export default MapContainer;
