import { ObjectsMap } from "@grafoo/cache";
import { ClientInstance } from "@grafoo/core";
import { GrafooObject } from "@grafoo/tag";
import { GraphQlError, Variables } from "@grafoo/transport";

export interface Context {
  client: ClientInstance;
}

export interface QueryRenderProps {
  loading: boolean;
  loaded: boolean;
  objects?: ObjectsMap;
  errors?: GraphQlError[];
}

export interface QueryRenderFn {
  <T>(renderProps: QueryRenderProps & T): JSX.Element;
  <T, U>(renderProps: QueryRenderProps & T & U): JSX.Element;
  <T, U, V>(renderProps: QueryRenderProps & T & U & V): JSX.Element;
  (renderProps: QueryRenderProps & {}): JSX.Element;
}

export interface QueryProps {
  query: GrafooObject;
  variables?: Variables;
  skipCache?: boolean;
  render: QueryRenderFn;
}

export interface MutationRenderProps {
  mutate<T>(variables?: Variables): Promise<T>;
  client: ClientInstance;
}

export type MutationRenderFn = (props: MutationRenderProps) => JSX.Element;

export interface MutationProps {
  query: GrafooObject;
  render: MutationRenderFn;
}

export interface Bindings {
  state: QueryRenderProps;
  update(nextObjects: ObjectsMap, cb: () => void);
  executeQuery(cb: () => void);
}
