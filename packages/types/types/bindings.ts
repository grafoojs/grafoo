import { ClientInstance } from "./core";
import { GrafooObject } from "./tag";
import { GraphQlError, Variables } from "./transport";

export interface Bindings {
  getState(): GrafooRenderProps;
  unbind(): void;
  load(): void;
}

export interface GrafooRenderProps {
  client: ClientInstance;
  errors?: GraphQlError[];
  load(): void;
  loaded: boolean;
  loading: boolean;
}

export type Mutate<T> = (variables?: Variables) => Promise<T>;

export type GrafooRenderFn = <T>(renderProps: GrafooRenderProps) => T;

export type UpdateFn<T, U> = (props: GrafooRenderProps & T, data?: U) => T;

export type OptimisticUpdateFn<T> = (props: GrafooRenderProps & T, variables?: Variables) => T;

export interface GrafooMutation<T, U = {}> {
  query: GrafooObject;
  optimisticUpdate?: OptimisticUpdateFn<T>;
  update: UpdateFn<T, U>;
}

export interface GrafooConsumerProps<T = {}> {
  query?: GrafooObject;
  variables?: Variables;
  mutations?: { [name: string]: GrafooMutation<T> };
  skip?: boolean;
}
