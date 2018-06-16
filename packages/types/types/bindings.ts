import { ClientInstance, GrafooObject } from "./core";
import { GraphQlError, Variables } from "./transport";

/**
 * T = Query
 * U = Mutations
 */
export interface GrafooBindings<T, U> {
  getState(): GrafooRenderProps & T & GrafooRenderMutations<U>;
  unbind(): void;
  load(): void;
}

export interface GrafooRenderProps {
  client: ClientInstance;
  errors?: GraphQlError[];
  load: () => void;
  loaded: boolean;
  loading: boolean;
}

/**
 * T = Query
 * U = Mutations
 */
export type UpdateFn<T, U> = (props: T, data?: U) => T;

/**
 * T = Query
 */
export type OptimisticUpdateFn<T> = (props: T, variables?) => T;

/**
 * T = Query
 * U = Mutations
 * V = keyof Mutation
 */
export type GrafooMutations<T, U> = {
  [V in keyof U]: {
    query: GrafooObject;
    optimisticUpdate?: OptimisticUpdateFn<T>;
    update: UpdateFn<T, U[V]>;
  }
};

export interface Context {
  client: ClientInstance;
}

/**
 * T = Mutations
 * U = keyof Mutations
 */
export type GrafooRenderMutations<T> = { [U in keyof T]: (variables?) => Promise<void> };

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
