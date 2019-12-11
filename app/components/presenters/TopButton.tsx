import React, {
  Fragment,
} from 'react';

import {
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import constants from 'lib/constants';
import { centerline } from 'lib/selectors';
import { TopButtonProps } from 'containers/TopButtonContainer';

const colors = constants.colors.topButton;
const {
  fontFamily,
  fontSize,
  opacity,
  size,
} = constants.topButton;

const expansionPerChar = 6.5;
const expansion = (count: string) => (count.length - 1) * expansionPerChar;

const Styles = StyleSheet.create({
  bubble: {
    borderRadius: size / 6,
    position: 'absolute',
    paddingTop: size / 4,
    height: size / 3,
    justifyContent: 'center',
    flexDirection: 'row',
    opacity,
  },
  button: {
    borderRadius: size / 2,
    position: 'absolute',
    paddingTop: size / 4,
    width: size,
    height: size,
    left: centerline() - constants.buttonSize / 2,
    justifyContent: 'center',
    flexDirection: 'row',
    opacity,
  },
  count: {
    color: colors.bubbleLabel,
    fontFamily,
    fontSize,
    position: 'absolute',
  }
})

const TopButton = (props: TopButtonProps) => (props.visible ? (
  <Fragment>
    <View
      style={[Styles.bubble, {
        backgroundColor: colors.bubble,
        left: centerline() + size / 2 - 4,
        top: props.topOffset,
        width: size / 3 + expansion(props.activityCount),
      }]}
    >
    </View>
    <Text style={[Styles.count, {
      top: props.topOffset,
      left: centerline() + size / 2 + 0.5,
    }]}>
      {props.activityCount}
    </Text>
    <TouchableHighlight
      style={[Styles.button, {
        backgroundColor: props.enabled ? colors.underlay : colors.background,
        top: props.topOffset,
      }]}
      onPress={() => { props.onDeleteActivity(props.activityId) }}
      underlayColor={props.enabled ? colors.background : colors.underlay}
    >
      <FontAwesome5
        color={colors.icon}
        name='bars'
        size={size / 2}
      />
    </TouchableHighlight>
  </Fragment>
) : null)

export default React.memo(TopButton);
