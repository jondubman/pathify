import React, {
  Component,
} from 'react';

import {
  FlatList,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import { ActivityListProps } from 'containers/ActivityListContainer';
import constants from 'lib/constants';
import { ActivityUpdate } from 'shared/activities';
import {
  metersToMilesText,
  msecToString,
} from 'shared/units';

const colors = constants.colors.activityList;
const {
  borderRadius,
  borderWidth,
  height,
} = constants.activityList;

const Styles = StyleSheet.create({
  activity: {
    borderRadius,
    borderWidth,
    height: height,
    width: constants.minDeviceWidth / 3,
  },
  currentActivity: {
    backgroundColor: colors.current.background,
    borderColor: colors.current.border,
  },
  pastActivity: {
    backgroundColor: colors.past.background,
    borderColor: colors.past.border,
  },
  box: {
    backgroundColor: colors.background,
    height,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  outer: {
    marginHorizontal: 10,
  },
  text: {
    alignSelf: 'flex-end',
    color: colors.text,
    fontWeight: 'bold',
    margin: 2,
    marginRight: 4,
  },
})

const renderItem = ({ item, index, separators }) => {
  const activity = item as ActivityUpdate;
  const isCurrent = !activity.tEnd;
  const time = (activity.tLastUpdate && activity.tStart) ?
    msecToString(activity.tLastUpdate - activity.tStart) : '';
  const distance = (activity.odo && activity.odoStart) ?
    metersToMilesText(activity.odo - activity.odoStart) : '';

  return (
    <TouchableHighlight
      onPress={() => {
      }}
      style={Styles.outer}
      underlayColor={isCurrent ? colors.current.underlay : colors.past.underlay }
    >
      <View style={[Styles.activity, isCurrent ? Styles.currentActivity : Styles.pastActivity]}>
        <Text style={Styles.text}>{time}</Text>
        <Text style={Styles.text}>{distance}</Text>
      </View>
    </TouchableHighlight>
  )
}

// getItemLayout = {(data, index) => (
//   { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
// )}

class ActivityList extends Component<ActivityListProps> {

  constructor(props: ActivityListProps) {
    super(props);
  }

  render() {
    return (
      <View style={[Styles.box, { top: this.props.top }]}>
        <FlatList<ActivityUpdate>
          data={this.props.list}
          horizontal
          ref={(ref) => {
            if (ref) {
              this.props.registerRef(ref);
            }
          }}
          renderItem={renderItem}
        />
      </View>
    )
  }
}

export default ActivityList;
