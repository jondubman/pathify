// Note this is the container for MapArea but for brevity, it's called MapContainer instead of MapAreaContainer.
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { LocationEvent } from 'shared/locations';
import { dynamicMapHeight, dynamicMapStyle, mapHidden } from 'lib/selectors';
import { AppState } from 'lib/state';
import utils from 'lib/utils';
import MapArea from 'presenters/MapArea';

interface MapAreaStateProps {
  height: number;
  mapHidden: boolean;
  mapStyleURL: string;
  width: number;
  userLocation?: LocationEvent;
}

interface MapAreaDispatchProps {
  backgroundTapped: (args: any) => void;
  mapRegionChanged: (args: any) => void;
  mapRegionChanging: (args: any) => void;
  mapTapped: (args: any) => void;
  userMovedMap: (args: any) => void;
}

export type MapAreaProps = MapAreaStateProps & MapAreaDispatchProps;

const mapStateToProps = (state: AppState): MapAreaStateProps => {
  const mapStyle = dynamicMapStyle(state);
  const { width } = utils.windowSize();
  return {
    height: dynamicMapHeight(state),
    mapHidden: mapHidden(state),
    mapStyleURL: mapStyle.url,
    width,
    userLocation: state.userLocation,
  }
}

const mapDispatchToProps = (dispatch: Function): MapAreaDispatchProps => {
  const dispatchers = {
    backgroundTapped: (args: any) => {
      dispatch(newAction(AppAction.backgroundTapped, args));
    },
    mapTapped: (args: any) => {
      dispatch(newAction(AppAction.mapTapped, args));
    },
    mapRegionChanged: (args: any) => {
      dispatch(newAction(AppAction.mapRegionChanged, args));
    },
    mapRegionChanging: (args: any) => {
      dispatch(newAction(AppAction.mapRegionChanging, args));
    },
    userMovedMap: (args: any) => {
      dispatch(newAction(AppAction.userMovedMap, args));
    },
  }
  return dispatchers;
}

const MapContainer = connect<MapAreaStateProps, MapAreaDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(MapArea as any);

export default MapContainer;
