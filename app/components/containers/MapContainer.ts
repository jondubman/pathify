// Note this is the container for MapArea but for brevity, it's called MapContainer instead of MapAreaContainer.
import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { dynamicMapHeight, dynamicMapStyle, mapHidden } from 'lib/selectors';
import { AppState, MapRegionUpdate } from 'lib/state';
import utils from 'lib/utils';
import MapArea from 'presenters/MapArea';
import { LonLat } from 'shared/locations';

interface MapAreaStateProps {
  height: number;
  initialBounds: LonLat[],
  initialHeading: number,
  initialZoomLevel: number,
  mapHidden: boolean;
  mapStyleURL: string;
  width: number;
}

interface MapAreaDispatchProps {
  backgroundTapped: (args: any) => void;
  mapRegionChanged: (MapRegionUpdate) => void;
  mapRegionChanging: () => void;
  mapRendered: () => void;
  mapTapped: (args: any) => void;
  userMovedMap: () => void;
}

export type MapAreaProps = MapAreaStateProps & MapAreaDispatchProps;

const mapStateToProps = (state: AppState): MapAreaStateProps => {
  const mapStyle = dynamicMapStyle(state);
  const { width } = utils.windowSize();
  return {
    initialBounds: state.mapBoundsInitial!,
    initialHeading: state.mapHeadingInitial!,
    initialZoomLevel: state.mapZoomInitial!,
    height: dynamicMapHeight(state),
    mapHidden: mapHidden(state),
    mapStyleURL: mapStyle.url,
    width,
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
    mapRegionChanged: (mapRegionUpdate: MapRegionUpdate) => {
      dispatch(newAction(AppAction.mapRegionChanged, mapRegionUpdate));
    },
    mapRegionChanging: () => {
      dispatch(newAction(AppAction.mapRegionChanging));
    },
    mapRendered: () => {
      dispatch(newAction(AppAction.mapRendered));
    },
    userMovedMap: () => {
      dispatch(newAction(AppAction.userMovedMap));
    },
  }
  return dispatchers;
}

const MapContainer = connect<MapAreaStateProps, MapAreaDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(MapArea as any);

export default MapContainer;
