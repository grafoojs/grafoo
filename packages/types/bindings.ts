import { ObjectsMap } from "./cache";
import { GrafooObject } from "./tag";
import { GraphQlError, Variables } from "./transport";

export interface Bindings {
  getState(): GrafooRenderProps;
  update(nextObjects: ObjectsMap): void;
  executeQuery(): void;
}

export interface GrafooRenderProps {
  loading: boolean;
  loaded: boolean;
  errors?: GraphQlError[];
}

export type Mutate = <T>(variables?: Variables) => Promise<T>;

export type GrafooRenderFn = <T>(renderProps: GrafooRenderProps) => T;

export type UpdateFn = <T>(
  props: { mutate: Mutate } & GrafooRenderProps,
  variables?: Variables
) => Promise<T>;

export type OptimisticUpdateFn = <T>(props: GrafooRenderProps, variables?: Variables) => T;

export interface GrafooMutation {
  query: GrafooObject;
  update: UpdateFn;
  optmisticUpdate?: OptimisticUpdateFn;
}

export interface GrafooConsumerProps {
  query: GrafooObject;
  mutations?: { [name: string]: GrafooMutation };
  variables?: Variables;
  skipCache?: boolean;
  render: GrafooRenderFn;
  [key: string]: any;
}
