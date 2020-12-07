// server can query a running app by pushing an appQuery message to the app

// These are the properties of ActivityData that can be range queried remotely from the dev server.
// Since the query is run by Realm, they need to be properties of the schema, not those added by ActivityDataExtended.
// Also, since JSON doesn't support Infinity (or -Infinity), you have to use real numbers for the range min and max.
export const rangeQueryableActivityProps = [
  'count',
  'maxGapTime',
  'schemaVersion',
  'tStart',
  'tEnd',
]

export type ActivityRangeQuery = { [key: string]: [number, number] };

export interface AppQueryDescriptor {
  type: string; // activities, activity, events, eventCount, options, etc. - see appQuery saga.
  // Note this is the type of the AppQueryDescriptor, not the type of the action sent to the app, which is 'appQuery'.
  activityId?: string;
  countOnly?: boolean; // true means count results rather than sending them all
  includeEvents?: boolean; // include low-level events in the results

  activityRangeQueries: ActivityRangeQuery | undefined,

  level?: number; // applies to logs (default 0)
  limit?: number; // applies to events, which may be numerous
  pageSize?: number; // applies to logs and events, works with startIndex
  startIndex?: number; // applies to logs and events
  timeRange?: [number, number]; // applies to logs
}

// contains AppQueryDescriptor
export interface AppQueryParams {
  include?: object;
  query: AppQueryDescriptor;
  timeout?: number;
  uuid: string;
}

export interface AppQueryResponse {
  uuid: string; // matches uuid in AppQueryParams
  queryTime?: number; // msec
  response: any;
}
