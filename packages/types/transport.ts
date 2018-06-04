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

export type TransportRequest = <T>(query: string, variables?: Variables) => Promise<T>;

export type Headers = (() => {}) | {};
