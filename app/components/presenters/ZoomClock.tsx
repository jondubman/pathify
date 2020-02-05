import * as React from 'react';

import {
  StyleSheet,
  View,
} from 'react-native';

import PausedClockContainer from 'containers/PausedClockContainer';
import NowClockContainer from 'containers/NowClockContainer';
import { ZoomClockProps } from 'containers/ZoomClockContainer';
import constants from 'lib/constants';
import { centerline } from 'lib/selectors';

const clockWidth = constants.clock.height;

const Styles = StyleSheet.create({
  clockCenter: {
    left: centerline() - clockWidth / 2,
    position: 'absolute',
  },
})

const ZoomClock = (props: ZoomClockProps) => (
  <View style={[Styles.clockCenter, { bottom: props.bottom }]}>
    {props.nowMode ? <NowClockContainer interactive={true} key='NowClock' />
      : <PausedClockContainer interactive={true} key='PausedClock' />}
  </View>
)

export default ZoomClock;
