import React, {
  Fragment,
} from 'react';

import {
  StyleSheet,
  TouchableHighlight,
  View,
  Text,
} from 'react-native';

import { RefTimeProps } from 'containers/RefTimeContainer';
import constants from 'lib/constants';

const colors = constants.colors.refTime;

const Styles = StyleSheet.create({
  leftHalf: {
    backgroundColor: 'transparent', // nothing left of the centerline, for now
    width: constants.refTime.width,
  },
  refTimeContainer: {
    alignSelf: 'center',
    height: constants.refTime.height,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    width: constants.refTime.width * 2,
  },
  refTimeFull: {
    flexDirection: 'row',
  },
  refTimeText: {
    fontFamily: 'futura',
    fontSize: 15,
  },
  rightHalf: {
    backgroundColor: colors.background,
    borderRightColor: colors.border,
    borderRightWidth: 1,
    borderTopColor: colors.border,
    borderTopRightRadius: constants.refTime.height,
    borderTopWidth: 1,
    height: constants.refTime.height,
    paddingLeft: 3,
    paddingTop: 5,
    width: constants.refTime.width,
  },
  subText: {
    color: colors.subText,
    fontFamily: 'futura',
    fontSize: 11,
  },
  hoursMinutes: {
    color: colors.hoursMinutes,
  },
  seconds: {
    color: colors.seconds,
  },
  msec: {
    color: colors.msec,
  },
})

const RefTime = (props: RefTimeProps) => (
  <View style={[Styles.refTimeContainer, { bottom: props.bottom }]}>
    <View style={Styles.leftHalf} />
    <TouchableHighlight
      onPress={() => { console.log('TODO') }}
      style={Styles.rightHalf}
      underlayColor={colors.underlay}
    >
      <Fragment>
        <View style={Styles.refTimeFull}>
          <Text style={[Styles.refTimeText, Styles.hoursMinutes]}>
            10:23
          </Text>
          <Text style={[Styles.refTimeText, Styles.seconds]}>
            :45
          </Text>
          <Text style={[Styles.refTimeText, Styles.msec]}>
            :67
          </Text>
        </View>
        <Text style={Styles.subText}>
          PM SAT FEB 9, 2019
        </Text>
      </Fragment>
    </TouchableHighlight>
  </View>
)

export default RefTime;
