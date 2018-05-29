import { GrafooObject } from "./tag";
import { GraphQlError, Variables } from "./transport";

export interface Bindings {
  getState(): GrafooRenderProps;
  unbind(): void;
  executeQuery(): void;
}

export interface GrafooRenderProps {
  loading: boolean;
  loaded: boolean;
  errors?: GraphQlError[];
}

export type Mutate<T> = (variables?: Variables) => Promise<T>;

export type GrafooRenderFn = <T>(renderProps: GrafooRenderProps) => T;

type UpdateProps<T, U> = { mutate: Mutate<U> } & GrafooRenderProps & T;

export type UpdateFn<T, U> = (props: UpdateProps<T, U>, variables?: Variables) => Promise<T>;

export type OptimisticUpdateFn<T> = (props: GrafooRenderProps & T, variables?: Variables) => T;

export interface GrafooMutation<T, U = {}> {
  query: GrafooObject;
  optimisticUpdate?: OptimisticUpdateFn<T>;
  update: UpdateFn<T, U>;
}

export interface GrafooConsumerProps<T = {}> {
  query?: GrafooObject;
  mutations?: { [name: string]: GrafooMutation<T> };
  variables?: Variables;
  skip?: boolean;
  children?: [GrafooRenderFn];
}
