// server can query a running app by pushing an appQuery message to the app

export interface AppQueryDescriptor {
  type: string; // activities, activity, events, eventCount, options, etc. - see appQuery saga.

  activityId?: string;
  count?: boolean; // true means count results rather than sending them all
  events?: boolean; // true means include events

  level?: number; // applies to logs (default 0)
  limit?: number; // applies to events, which may be numerous
  pageSize?: number; // applies to logs and events, works with startIndex
  startIndex?: number; // applies to logs and events
  timeRange?: [number, number]; // applies to logs
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
}
