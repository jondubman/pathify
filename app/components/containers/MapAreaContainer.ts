import { connect } from 'react-redux';

import { AppAction, newAction } from 'lib/actions';
import { LonLat } from 'lib/locations';
import {
  dynamicMapHeight,
  dynamicMapStyle,
  dynamicTimelineHeight,
  mapHidden,
} from 'lib/selectors';
import {
  AppState,
} from 'lib/state';
import utils from 'lib/utils';
import MapArea, { MapRegionUpdate } from 'presenters/MapArea';

interface MapAreaStateProps {
  height: number;
  initialBounds: LonLat[],
  initialHeading: number,
  initialZoomLevel: number,
  mapHidden: boolean;
  mapStyleURL: string;
  timelineHeight: number;
  width: number;
}

interface MapAreaDispatchProps {
  backgroundTapped: (args: any) => void;
  mapRegionChanged: (MapRegionUpdate) => void;
  mapRegionChanging: () => void;
  mapRendered: () => void;
  mapTapped: (args: any) => void;
  userMovedMap: (center: LonLat) => void;
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
    timelineHeight: dynamicTimelineHeight(state),
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
    userMovedMap: (center: LonLat) => {
      dispatch(newAction(AppAction.userMovedMap, { center }));
    },
  }
  return dispatchers;
}

const MapAreaContainer = connect<MapAreaStateProps, MapAreaDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(MapArea as any);

export default MapAreaContainer;
