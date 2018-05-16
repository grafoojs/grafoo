import { ObjectsMap, Variables } from "@grafoo/cache";
import { ClientInstance } from "@grafoo/core";
import { GrafooObject } from "@grafoo/tag";
import { GraphQlError } from "@grafoo/transport";

export interface Context {
  client: ClientInstance;
}

export interface QueryRenderProps {
  loading: boolean;
  data?: { [key: string]: any };
  objects?: ObjectsMap;
  errors?: GraphQlError[];
}

export type QueryRenderFn = (props: QueryRenderProps) => JSX.Element;

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
