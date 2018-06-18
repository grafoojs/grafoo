/**
 * Transport
 */

export declare interface GraphQlError {
  message: string;
  locations: { line: number; column: number }[];
  path: string[];
}

export declare interface GraphQlPayload<T> {
  data: T;
  errors?: GraphQlError[];
}

export declare interface Variables {
  [key: string]: any;
}

export declare type TransportRequest = <T>(query: string, variables?: Variables) => Promise<T>;

export declare type Headers = (() => {}) | {};

/**
 * Core
 */

export declare interface ObjectsMap {
  [key: string]: { [key: string]: any };
}

export declare interface PathsMap {
  [key: string]: { [key: string]: any };
}

export declare type Listener = (objects: ObjectsMap) => void;

export declare interface InitialState {
  objectsMap: ObjectsMap;
  pathsMap: PathsMap;
}

export declare interface ClientInstance {
  request: <T>(grafooObject: GrafooObject, variables?: Variables) => Promise<T>;
  listen: (listener: Listener) => () => void;
  write: {
    (grafooObject: GrafooObject, variables: Variables, data: {}): void;
    (grafooObject: GrafooObject, data: {}): void;
  };
  read: <T>(
    grafooObject: GrafooObject,
    variables?: Variables
  ) => { data?: T; objects?: ObjectsMap };
  flush: () => InitialState;
}

export declare interface ClientOptions {
  initialState?: InitialState;
  idFields?: Array<string>;
  headers?: Headers;
}

export declare interface GrafooObject {
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
export declare interface GrafooBindings<T, U> {
  getState(): GrafooRenderProps & T & GrafooRenderMutations<U>;
  unbind(): void;
  load(): void;
}

export declare interface GrafooRenderProps {
  errors?: GraphQlError[];
  load?: () => void;
  loaded?: boolean;
  loading?: boolean;
}

/**
 * T = Query
 * U = Mutations
 */
export declare type UpdateFn<T, U> = (props: T, data?: U) => T;

/**
 * T = Query
 */
export declare type OptimisticUpdateFn<T> = (props: T, variables?: Variables) => T;

/**
 * T = Query
 * U = Mutations
 * V = keyof Mutation
 */
export declare type GrafooMutations<T, U> = {
  [V in keyof U]: {
    query: GrafooObject;
    optimisticUpdate?: OptimisticUpdateFn<T>;
    update?: UpdateFn<T, U[V]>;
  }
};

export declare interface Context {
  client: ClientInstance;
}

/**
 * T = Mutations
 * U = keyof Mutations
 */
export declare type GrafooRenderMutations<T> = {
  [U in keyof T]: (variables?: Variables) => Promise<T[U]>
};

/**
 * T = Query
 * U = Mutations
 */
export declare interface GrafooConsumerProps<T, U> {
  query?: GrafooObject;
  variables?: Variables;
  mutations?: GrafooMutations<T, U>;
  skip?: boolean;
}
