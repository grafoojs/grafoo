/**
 * GrafooTransport
 */

export interface GraphQlError {
  message: string;
  locations: { line: number; column: number }[];
  path: string[];
}

/**
 * T = QueryData
 */
export interface GraphQlPayload<T> {
  data: T;
  errors?: GraphQlError[];
}

export interface Variables {
  [key: string]: any;
}

/**
 * T = QueryData
 */
export type GrafooTransport = <T>(
  query: string,
  variables?: Variables
) => Promise<GraphQlPayload<T>>;

/**
 * Core
 */

export interface ObjectsMap {
  [key: string]: {};
}

export interface PathsMap {
  [key: string]: {
    data: { [key: string]: any };
    objects: string[];
  };
}

export type Listener = (objects: ObjectsMap) => void;

export interface InitialState {
  objectsMap: ObjectsMap;
  pathsMap: PathsMap;
}

export interface GrafooClient {
  execute: <T>(grafooObject: GrafooObject, variables?: Variables) => Promise<GraphQlPayload<T>>;
  listen: (listener: Listener) => () => void;
  write: {
    <T>(grafooObject: GrafooObject, variables: Variables, data: T | { data: T }): void;
    <T>(grafooObject: GrafooObject, data: T | { data: T }): void;
  };
  read: <T>(
    grafooObject: GrafooObject,
    variables?: Variables
  ) => { data?: T; objects?: ObjectsMap; partial?: boolean };
  readByKey: (key: string) => {} | undefined;
  flush: () => InitialState;
  reset: () => void;
}

export interface GrafooClientOptions {
  initialState?: InitialState;
  idFields?: Array<string>;
}

export interface GrafooObject {
  frags?: {
    [key: string]: string;
  };
  paths: {
    [key: string]: {
      name: string;
      args: string[];
    };
  };
  query: string;
}

/**
 * Bindings
 */

/**
 * T = Query
 * U = Mutations
 */
export interface GrafooBindings<T, U> {
  getState(): GrafooBoundState & T & GrafooBoundMutations<U>;
  unbind(): void;
  load(variables?: Variables): void;
}

export interface GrafooBoundState {
  client: GrafooClient;
  errors?: GraphQlError[];
  load?: (variables?: Variables) => void;
  loaded?: boolean;
  loading?: boolean;
}

/**
 * T = Query
 * U = Mutations
 */
export type UpdateFn<T, U> = (props: T, data?: U) => T;

/**
 * T = Query
 */
export type OptimisticUpdateFn<T> = (props: T, variables?: Variables) => T;

/**
 * T = Query
 * U = Mutations
 * V = keyof Mutation
 */
export type GrafooMutations<T, U> = {
  [V in keyof U]: {
    query: GrafooObject;
    optimisticUpdate?: OptimisticUpdateFn<T>;
    update?: UpdateFn<T, U[V]>;
  }
};

export interface Context {
  client: GrafooClient;
}

/**
 * T = Mutations
 * U = keyof Mutations
 */
export type GrafooBoundMutations<T> = {
  [U in keyof T]: (variables?: Variables) => Promise<GraphQlPayload<T[U]>>
};

/**
 * T = Query
 * U = Mutations
 */
export interface GrafooConsumerProps<T, U> {
  query?: GrafooObject;
  variables?: Variables;
  mutations?: GrafooMutations<T, U>;
  skip?: boolean;
}
