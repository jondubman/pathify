// server can query a running app by pushing an appQuery message to the app

import { TimeRange } from './timeseries';

export interface AppQueryDescriptor {
  type: string; // activities, activity, events, eventCount, options, etc. - see appQuery saga.

  activityId: string; // applies to activity, events
  count?: boolean; // applies to events
  exclude?: boolean;
  events: boolean; // applies to activity (true: include events)
  filterTypes?: string[]; // applies to events
  limit?: number; // applies to events
  since: number; // timestamp, applies to events
  sinceLastStartup?: boolean; // applies to events
  startIndex?: number; // applies to events
  timeRange?: TimeRange; // applies to events
}

export interface AppQueryParams {
  query: AppQueryDescriptor;
  timeout?: number;
  uuid: string;
}

export interface AppQueryResponse {
  uuid: string;
  response: any;
}
