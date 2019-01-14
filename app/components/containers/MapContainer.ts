// Note this is the container for MapArea but for brevity, it's called MapContainer instead of MapAreaContainer.

import { connect } from 'react-redux';

import constants from 'lib/constants';
import { AppState } from 'lib/reducer';
import utils from 'lib/utils';

import { LocationEvent } from 'lib/geo';
import MapArea from 'presenters/MapArea';

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
  const mapStyle = constants.mapStyles[state.options.mapStyle];
  const { height, width } = utils.windowSize();
  return {
    height: height - constants.timeline.height,
    mapStyleURL: mapStyle.url,
    opacity: mapStyle.opacity,
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
  mapStateToProps as any, // TODO 'as any' addresses TS error 2345
  mapDispatchToProps
)(MapArea as any); // TODO 'as any' addresses TS error 2345

export default MapContainer;
