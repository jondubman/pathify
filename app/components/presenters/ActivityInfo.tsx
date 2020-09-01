// This component contains the ActivityList and/or ActivityDetails as well as the GrabBar that resizes this area.
import * as React from 'react';

import ActivityDetailsContainer from 'containers/ActivityDetailsContainer';
import { ActivityInfoProps } from 'containers/ActivityInfoContainer';
import ActivityListContainer from 'containers/ActivityListContainer';

const ActivityInfo = (props: ActivityInfoProps) => (
  <React.Fragment>
    {props.showActivityList ? <ActivityListContainer /> : null}
    {props.showActivityDetails ? <ActivityDetailsContainer /> : null}
  </React.Fragment>
)

export default ActivityInfo;
