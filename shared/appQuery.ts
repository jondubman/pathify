// server can query a running app by pushing an appQuery message to the app

export interface AppQueryDescriptor {
  type: string;
}

export interface AppQueryParams {
  query: AppQueryDescriptor;
  timeout?: number;
  uuid: string;

  count?: boolean;
  limit?: number;
  filterTypes?: string[];
}

export interface AppQueryResponse {
  uuid: string;
  response: any;
}
