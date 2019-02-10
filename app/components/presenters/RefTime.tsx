import * as React from 'react';

import {
  StyleSheet,
  View,
} from 'react-native';

import { RefTimeProps } from 'containers/RefTimeContainer';
import constants from 'lib/constants';

const Styles = StyleSheet.create({
  refTime: {
    alignSelf: 'center',
    height: constants.refTime.height,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    width: constants.refTime.width * 2,
  },
  leftHalf: {
    backgroundColor: 'transparent', // nothing left of the centerline, for now
    width: constants.refTime.width,
  },
  rightHalf: {
    backgroundColor: constants.colors.byName.yellow + '66', // TODO
    borderTopRightRadius: constants.refTime.height,
    height: constants.refTime.height,
    width: constants.refTime.width,
  },
})

const RefTime = (props: RefTimeProps) => (
  <View style={[Styles.refTime, { bottom: props.bottom }]}>
    <View style={Styles.leftHalf} />
    <View style={Styles.rightHalf} />
  </View>
)

export default RefTime;
