export type GraphQlError = {
  message: string;
  locations: { line: number; column: number }[];
  path: string[];
};

export type GraphQlPayload<T> = {
  data: T;
  errors?: GraphQlError[];
};

export type GrafooTransport = <T>(
  query: string,
  variables?: unknown,
  id?: string
) => Promise<GraphQlPayload<T>>;

export type GrafooRecords = Record<string, Record<string, unknown>>;

export type GrafooListener = (objects: GrafooRecords) => void;

export type GrafooInitialState = {
  records: GrafooRecords;
  paths: GrafooPath;
};

export type GrafooPath<T extends { id: string } = { id: string }> =
  | { [U in keyof T]: U extends "id" ? string : GrafooPath }
  | GrafooPath[]
  | null;

export type GrafooSelection = {
  args?: Record<string, string>;
  scalars?: string[];
  fragments?: string[];
  select?: Record<string, GrafooSelection>;
};

export type GrafooQuery<T = unknown, U = unknown> = {
  document: string;
  id?: string;
  operation?: GrafooSelection;
  fragments?: GrafooSelection;
  _queryType?: T;
  _variablesType?: U;
};

export type GrafooClient = {
  execute: <T extends GrafooQuery>(
    query: T,
    variables?: T["_variablesType"]
  ) => Promise<GraphQlPayload<T["_queryType"]>>;
  write: {
    <T extends GrafooQuery>(query: T, variables: T["_variablesType"], data: T["_queryType"]): void;
    <T extends GrafooQuery>(query: T, data: T["_queryType"]): void;
  };
  read: <T extends GrafooQuery>(
    query: T,
    variables?: T["_variablesType"]
  ) => { data?: T["_queryType"]; records?: GrafooRecords; partial?: boolean };
  listen: (listener: GrafooListener) => () => void;
  flush: () => GrafooInitialState;
  reset: () => void;
};

export type GrafooClientOptions = {
  initialState?: GrafooInitialState;
  idFields?: Array<string>;
};
