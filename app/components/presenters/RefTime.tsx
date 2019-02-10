import * as React from 'react';

import {
  StyleSheet,
  View,
  Text,
} from 'react-native';

import { RefTimeProps } from 'containers/RefTimeContainer';
import constants from 'lib/constants';

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
  refTimeText: {
    color: 'white',
    fontFamily: 'futura',
    fontSize: 15,
    // fontWeight: 'bold',
  },
  rightHalf: {
    backgroundColor: constants.colors.byName.silver + '28', // TODO
    borderTopRightRadius: constants.refTime.height,
    height: constants.refTime.height,
    paddingLeft: 5,
    paddingTop: 5,
    width: constants.refTime.width,
  },
  subText: {
    color: constants.colors.byName.gray,
    fontFamily: 'futura',
    fontSize: 12,
  },
})

const RefTime = (props: RefTimeProps) => (
  <View style={[Styles.refTimeContainer, { bottom: props.bottom }]}>
    <View style={Styles.leftHalf} />
    <View style={Styles.rightHalf}>
      <Text style={Styles.refTimeText}>
        1:23:45:6789
      </Text>
      <Text style={Styles.subText}>
        PM SAT FEB 9, 2019
      </Text>
    </View>
  </View>
)

export default RefTime;
