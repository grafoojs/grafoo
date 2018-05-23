export interface GraphQlError {
  message: string;
  locations: { line: number; column: number }[];
  path: string[];
}
export interface GraphQlPayload<T> {
  data: T;
  errors?: GraphQlError[];
}

export interface Variables {
  [key: string]: any;
}

export interface GraphQLRequestContext {
  query: string;
  variables?: Variables;
}

export type TransportRequest = <T>(request: GraphQLRequestContext) => Promise<T>;

export type Headers = (() => {}) | {};
