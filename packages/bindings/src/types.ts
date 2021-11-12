import { GraphQlError, GraphQlPayload, GrafooQuery } from "@grafoo/core";

export type GrafooBoundMutations<T extends Record<string, GrafooQuery>> = {
  [U in keyof T]: (
    variables: T[U]["_variablesType"]
  ) => Promise<GraphQlPayload<T[U]["_queryType"]>>;
};

export type GrafooBoundState<
  T extends GrafooQuery,
  U extends Record<string, GrafooQuery>
> = T["_queryType"] &
  GrafooBoundMutations<U> & {
    loaded: boolean;
    loading: boolean;
    errors?: GraphQlError[];
  };

export type GrafooMutation<T extends GrafooQuery, U extends GrafooQuery> = {
  query: U;
  update?: (props: T["_queryType"], data: U["_queryType"]) => T["_queryType"];
  optimisticUpdate?: (props: T["_queryType"], variables: U["_variablesType"]) => T["_queryType"];
};

export type GrafooMutations<T extends GrafooQuery, U extends Record<string, GrafooQuery>> = {
  [V in keyof U]: GrafooMutation<T, U[V]>;
};

export type GrafooConsumerProps<T extends GrafooQuery, U extends Record<string, GrafooQuery>> = {
  query?: T;
  skip?: boolean;
  variables?: T["_variablesType"];
  mutations?: GrafooMutations<T, U>;
};
