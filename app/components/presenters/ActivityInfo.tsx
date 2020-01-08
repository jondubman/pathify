// This component contains the activity list and/or activity details.
import * as React from 'react';

import {
  StyleSheet,
  View,
} from 'react-native';

import { ActivityInfoProps } from 'containers/ActivityInfoContainer';
import ActivityListContainer from 'containers/ActivityListContainer';
import constants from 'lib/constants';

const colors = constants.colors.activityInfo;
const {
  height,
  sideMargin,
  topOffset,
} = constants.activityInfo;

const Styles = StyleSheet.create({
  box: {
    backgroundColor: colors.background,
    height,
    left: constants.buttonSize + constants.buttonOffset + sideMargin,
    position: 'absolute',
    right: constants.buttonSize + constants.buttonOffset + sideMargin,
    top: topOffset,
  },
})

const ActivityInfo = (props: ActivityInfoProps) => (
  <React.Fragment>
    <View pointerEvents="none" style={Styles.box} />
    {props.showActivityList ? <ActivityListContainer /> : null}
  </React.Fragment>
)

export default ActivityInfo;
