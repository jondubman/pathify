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

// TODO AppQueryDescriptor is sort of a union of subtypes. TS typings could reflect that more elegantly.
// It's just for development purposes, to support remote querying the app.

export interface AppQueryDescriptor {
  type: string; // activities, activity, events, eventCount, options, etc. - see appQuery saga.
  // Note this is the type of the AppQueryDescriptor, not the type of the action sent to the app, which is 'appQuery'.
  activityId?: string;
  activityRangeQueries: ActivityRangeQuery | undefined, // applies to activities
  countOnly?: boolean; // true means count results rather than sending them all
  includeEvents?: boolean; // include low-level events in the results
  level?: number; // applies to logs (default 0)
  limit?: number; // applies to activities or events
  pageSize?: number; // applies to logs and events, works with startIndex
  startIndex?: number; // applies activities, logs and events
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
