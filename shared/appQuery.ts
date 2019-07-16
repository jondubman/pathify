// server can query a running app by pushing an appQuery message to the app

import { TimeRange } from './timeseries';

export interface AppQueryDescriptor {
  type: string;

  count?: boolean;
  exclude?: boolean;
  filterTypes?: string[];
  group?: boolean;
  limit?: number;
  sinceLastStartup: boolean;
  timeRange?: TimeRange;
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
