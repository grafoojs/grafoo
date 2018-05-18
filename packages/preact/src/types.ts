import { ObjectsMap } from "@grafoo/cache";
import { ClientInstance } from "@grafoo/core";
import { GrafooObject } from "@grafoo/tag";
import { GraphQlError, Variables } from "@grafoo/transport";

export interface Context {
  client: ClientInstance;
}

export type Mutate = <T>(variables?: Variables) => Promise<T>;

export interface MutationRenderProps {
  mutate: Mutate;
  client: ClientInstance;
}

export type MutationRenderFn = (props: MutationRenderProps) => JSX.Element;

export interface MutationProps {
  query: GrafooObject;
  render: MutationRenderFn;
}

export interface GrafooRenderProps {
  loading: boolean;
  loaded: boolean;
  errors?: GraphQlError[];
}

export type GrafooRenderFn = (renderProps: GrafooRenderProps) => JSX.Element;

export type UpdateFn = <T>(
  props: { mutate: Mutate } & GrafooRenderProps,
  variables: Variables
) => Promise<T>;

export type OptimisticUpdateFn = <T>(props: GrafooRenderProps, variables: Variables) => T;

export interface GrafooMutation {
  query: GrafooObject;
  update: UpdateFn;
  optmisticUpdate?: OptimisticUpdateFn;
}

export interface GrafooConsumerProps {
  query: GrafooObject;
  mutations: { [name: string]: GrafooMutation };
  variables?: Variables;
  skipCache?: boolean;
  render: GrafooRenderFn;
  [key: string]: any;
}

export interface Bindings {
  getState(): GrafooRenderProps;
  update(nextObjects: ObjectsMap);
  executeQuery();
}
