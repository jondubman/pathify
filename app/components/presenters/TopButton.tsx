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
import LabelContainer from 'containers/LabelContainer';
import { TopButtonProps } from 'containers/TopButtonContainer';
import { tipTextStyle } from 'presenters/Label';

const colors = constants.colors.topButton;
const {
  fontFamily,
  fontSize,
  opacity,
  opacitySelected,
  size,
} = constants.topButton;

const expansionPerChar = 6.8; // this was empirically determined and depends on fontSize
const expansion = (count: string) => (count.length - 1) * expansionPerChar;
const sizeBase = size / 3;

const bubbleLeft = centerline() + size / 2 - 4;

const Styles = StyleSheet.create({
  bubble: {
    borderRadius: size / 6,
    position: 'absolute',
    paddingLeft: 1,
    paddingTop: size / 4,
    height: size / 3,
    justifyContent: 'center',
    flexDirection: 'row',
    opacity,
  },
  button: {
    borderWidth: 1.5,
    borderRadius: size / 2,
    position: 'absolute',
    paddingLeft: 1,
    paddingTop: size / 4 - 2,
    width: size,
    height: size,
    left: centerline() - constants.buttonSize / 2,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  count: {
    color: colors.bubbleLabel,
    fontFamily,
    fontSize,
    position: 'absolute',
  },
  tipView: {
    flexDirection: 'row',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },
})

const backgroundColor = (props: TopButtonProps) => (props.selected ? (props.current ? colors.backgroundCurrentSelected :
                                                                                      colors.backgroundSelected) :
                                                                     colors.background)


const TopButton = (props: TopButtonProps) => (props.visible ? (
  <Fragment>
    <View style={[Styles.tipView, { top: props.topOffset + constants.buttonSize - 1 }]}>
      <LabelContainer>
        <Text style={tipTextStyle}>
          ACTIVITIES
        </Text>
      </LabelContainer>
    </View>
    {props.activityCount.length ? (<View
      style={[Styles.bubble, {
        backgroundColor: props.selected ? (props.current ? colors.bubbleNow : colors.bubblePast) : colors.bubble,
        left: bubbleLeft,
        top: props.topOffset,
        width: sizeBase + expansion(props.activityCount),
      }]}
    >
    </View>) : null}
    <Text style={[Styles.count, {
      top: props.topOffset,
      left: bubbleLeft,
      textAlign: 'center',
      width: sizeBase + expansion(props.activityCount),
    }]}>
      {props.activityCount}
    </Text>
    <TouchableHighlight
      style={[Styles.button, {
        backgroundColor: backgroundColor(props),
        borderColor: props.selected ? colors.borderSelected : colors.border,
        opacity: props.selected ? opacitySelected : opacity,
        top: props.topOffset,
      }]}
      onPressIn={props.onPressIn}
      underlayColor={props.enabled ? backgroundColor(props) : colors.underlay}
    >
      <FontAwesome5
        color={props.selected ? colors.iconSelected : colors.icon}
        name='bars'
        size={size / 2}
      />
    </TouchableHighlight>
  </Fragment>
) : null)

export default React.memo(TopButton);
