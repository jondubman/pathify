// This component contains the ActivityList and/or ActivityDetails as well as the GrabBar that resizes this area.
import * as React from 'react';

// import {
//   StyleSheet,
//   View,
// } from 'react-native';

import ActivityDetailsContainer from 'containers/ActivityDetailsContainer';
import { ActivityInfoProps } from 'containers/ActivityInfoContainer';
import ActivityListContainer from 'containers/ActivityListContainer';
import GrabBarContainer from 'containers/GrabBarContainer';
// import constants from 'lib/constants';

// const colors = constants.colors.activityInfo;
// const {
//   height,
//   sideMargin,
//   topOffset,
// } = constants.activityInfo;

// const Styles = StyleSheet.create({
//   box: {
//     backgroundColor: colors.background,
//     height,
//     left: constants.buttonSize + constants.buttonOffset + sideMargin,
//     position: 'absolute',
//     right: constants.buttonSize + constants.buttonOffset + sideMargin,
//     top: topOffset,
//   },
// })

const ActivityInfo = (props: ActivityInfoProps) => (
  <React.Fragment>
    {/*<View pointerEvents="none" style={Styles.box} />*/}
    {props.showActivityList ? <ActivityListContainer /> : null}
    {props.showActivityDetails ? <ActivityDetailsContainer /> : null}
    {props.showGrabBar ? <GrabBarContainer /> : null}
  </React.Fragment>
)

export default ActivityInfo;
