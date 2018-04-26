export interface Location {
  line: number;
  column: number;
}

export interface GraphQlError {
  message: string;
  locations: Location[];
  path: string[];
}

export interface Variables {
  [key: string]: any;
}

export interface GraphQLRequestContext {
  query: string;
  variables?: Variables;
}

export declare type TransportOptions = (() => RequestInit) | RequestInit;

export declare type TransportRequest = Promise<object>;

export interface GraphQLResponse {
  data?: any;
  errors?: GraphQlError[];
}

export default function createTransport(
  uri: string,
  options?: TransportOptions
): (GraphQLRequestContext) => Promise<GraphQLResponse>;
