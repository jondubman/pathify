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

import { FollowButtonsProps } from 'containers/FollowButtonsContainer';
import LabelContainer from 'containers/LabelContainer';
import constants from 'lib/constants';
import { labelTextStyle } from 'presenters/Label';

const colors = constants.colors.followButtons;
const {
  rightOffset,
  opacity,
  size,
} = constants.followButtons;

const Styles = StyleSheet.create({
  button: { // round
    borderRadius: size / 2,
    flexDirection: 'row',
    height: size,
    justifyContent: 'center',
    opacity,
    paddingTop: size / 4,
    position: 'absolute',
    right: rightOffset,
    width: size,
  },
  labelView: {
    flexDirection: 'row',
    textAlign: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: size + constants.buttonOffset * 2,
  },
})

const bottom1 = constants.buttonBaseOffsetPerRow - constants.bottomButtonSpacing;
const bottom2 = -constants.bottomButtonSpacing;

const FollowButtons = (props: FollowButtonsProps) => (props.hideBoth ? null : (
  <Fragment>
    {props.hideFollowPath ? null : (
      <Fragment>
        <View style={[Styles.labelView, { bottom: props.bottomOffset + bottom1 }]}>
          <LabelContainer>
            <Text style={labelTextStyle}>
              PAST
            </Text>
          </LabelContainer>
        </View>
        <TouchableHighlight
          hitSlop={constants.hitSlop}
          style={[Styles.button, {
            backgroundColor: props.followingPath ? colors.backgroundPath.active : colors.backgroundPath.inactive,
            bottom: props.bottomOffset + constants.buttonBaseOffsetPerRow,
          }]}
          onPressIn={props.onPressFollowPath}
          underlayColor={colors.underlayPath}
        >
          <View pointerEvents="none">
            <FontAwesome5
              color={props.followingPath ? colors.iconFollowPath.active : colors.iconFollowPath.inactive}
              name='location-arrow'
              size={constants.followButtons.size / 2}
            />
          </View>
        </TouchableHighlight>
      </Fragment>
    )}
    <View style={[Styles.labelView, { bottom: props.bottomOffset + bottom2 }]}>
      <LabelContainer>
        <Text style={labelTextStyle}>
          CURRENT
        </Text>
      </LabelContainer>
    </View>
    <TouchableHighlight
      hitSlop={constants.hitSlop}
      style={[Styles.button, {
        backgroundColor: props.followingUser ? colors.backgroundUser.active : colors.backgroundUser.inactive,
        bottom: props.bottomOffset,
      }]}
      onPressIn={props.onPressFollowUser}
      underlayColor={colors.underlayUser}
    >
      <View pointerEvents="none">
        <FontAwesome5
          color={props.followingUser ? colors.iconFollowUser.active : colors.iconFollowUser.inactive}
          name='location-arrow'
          size={constants.followButtons.size / 2}
        />
      </View>
    </TouchableHighlight>
  </Fragment>
))

export default React.memo(FollowButtons);
