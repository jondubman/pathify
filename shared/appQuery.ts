// server can query a running app by pushing an appQuery message to the app

export interface AppQueryDescriptor {
  type: string; // activities, activity, events, eventCount, options, etc. - see appQuery saga.

  activityId: string; // applies to activity, events
  count?: boolean; // applies to events
  events: boolean; // applies to activity (true: include events)
  level?: number; // applies to logs (default 0)
  limit?: number; // applies to events
  pageSize: number; // applies to logs, works with startIndex
  since: number; // timestamp, applies to events
  startIndex?: number; // applies to logs and events
  timeRange?: [number, number]; // applies to events
}

export interface AppQueryParams {
  include?: object;
  query: AppQueryDescriptor;
  timeout?: number;
  uuid: string;
}

export interface AppQueryResponse {
  uuid: string;
  response: any;
  responseTime: number;
}
