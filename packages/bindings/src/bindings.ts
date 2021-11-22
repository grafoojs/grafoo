import { GrafooClient, GraphQlError, GrafooQuery } from "@grafoo/core";
import { GrafooBoundMutations, GrafooBoundState, GrafooConsumerProps } from "./types";

export let makeGrafooConfig = <T extends GrafooQuery, U extends Record<string, GrafooQuery>>(
  init: GrafooConsumerProps<T, U>
) => init;

let clone = <T>(data: T) => JSON.parse(JSON.stringify(data));

export default function createBindings<
  T extends GrafooQuery,
  U extends Record<string, GrafooQuery>
>(
  client: GrafooClient,
  updater: (state: GrafooBoundState<T, U>) => void,
  props: GrafooConsumerProps<T, U>
) {
  type CP = GrafooConsumerProps<T, U>;
  let { query, variables, mutations, skip = false } = props;
  let data: CP["query"]["_queryType"];
  let errors: GraphQlError[];
  let partial = true;
  let unbind = () => {};

  if (query) {
    ({ data, partial } = client.read(query, variables));

    unbind = client.listen((shouldUpdate) => {
      if (preventListenUpdate) return;
      if (shouldUpdate) getUpdateFromClient();
    });
  }

  let boundMutations = {} as GrafooBoundMutations<U>;

  if (mutations) {
    for (let key in mutations) {
      let { update, optimisticUpdate, query: mutationQuery } = mutations[key];

      boundMutations[key] = (mutationVariables) => {
        if (query && optimisticUpdate) {
          client.write(query, variables, optimisticUpdate(clone(data), mutationVariables));
        }

        return client.execute(mutationQuery, mutationVariables).then((mutationResponse) => {
          if (query && update && mutationResponse.data) {
            client.write(query, variables, update(clone(data), mutationResponse.data));
          }

          return mutationResponse;
        });
      };
    }
  }

  let shouldLoad = !!query && !skip && !hasData();
  let preventListenUpdate = shouldLoad;
  let state = { loaded: hasData(), loading: shouldLoad };

  function hasData() {
    return !!Object.keys(data ?? {}).length && !partial;
  }

  function getUpdateFromClient() {
    ({ data, partial } = client.read(query, variables));
    Object.assign(state, { loaded: hasData() });
    updater(getState());
  }

  function getState(): GrafooBoundState<T, U> {
    return Object.assign({}, state, boundMutations, data);
  }

  function load(nextVariables?: CP["query"]["_variablesType"]) {
    variables = nextVariables ?? variables;
    preventListenUpdate = true;

    if (!state.loading) {
      Object.assign(state, { loading: true });
      updater(getState());
    }

    return client.execute(query, variables).then((res) => {
      ({ data, errors } = res);

      if (data) client.write(query, variables, data);

      Object.assign(state, { loaded: !!data, loading: false }, errors && { errors });
      updater(getState());
      preventListenUpdate = false;
    });
  }

  return { unbind, getState, load };
}
