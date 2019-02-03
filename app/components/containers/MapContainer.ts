// Note this is the container for MapArea but for brevity, it's called MapContainer instead of MapAreaContainer.

import { connect } from 'react-redux';

import { AppState } from 'lib/reducer';
import utils from 'lib/utils';

import { appAction, newAction } from 'lib/actions';
import { LocationEvent } from 'lib/geo';
import MapArea from 'components/MapArea';
import { dynamicMapHeight, dynamicMapStyle, mapHidden } from 'lib/selectors';

interface MapAreaStateProps {
  height: number;
  mapHidden: boolean;
  mapStyleURL: string;
  opacity: number;
  width: number;
  userLoc?: LocationEvent;
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
    opacity: state.options.mapOpacity,
    width,
    userLoc: state.loc,
  }
}

const mapDispatchToProps = (dispatch: any): MapAreaDispatchProps => {
  const dispatchers = {
    backgroundTapped: (args: any) => {
      dispatch(newAction(appAction.BACKGROUND_TAPPED, args));
    },
    mapTapped: (args: any) => {
      dispatch(newAction(appAction.MAP_TAPPED, args));
    },
    mapRegionChanged: (args: any) => {
      dispatch(newAction(appAction.MAP_REGION_CHANGED, args));
    },
    mapRegionChanging: (args: any) => {
      dispatch(newAction(appAction.MAP_REGION_CHANGING, args));
    },
    userMovedMap: (args: any) => {
      dispatch(newAction(appAction.USER_MOVED_MAP, args));
    },
  }
  return dispatchers;
}

const MapContainer = connect<MapAreaStateProps, MapAreaDispatchProps>(
  mapStateToProps as any,
  mapDispatchToProps
)(MapArea as any);

export default MapContainer;
