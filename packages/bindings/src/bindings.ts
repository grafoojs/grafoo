import { GrafooClient, GraphQlError, GrafooQuery } from "@grafoo/core";
import {
  GrafooBindings,
  GrafooBoundMutations,
  GrafooBoundState,
  GrafooConsumerProps
} from "./types";

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
): GrafooBindings<T, U> {
  type CP = GrafooConsumerProps<T, U>;
  let { query, variables, mutations, skip = false } = props;
  let data: CP["query"]["_queryType"];
  let errors: GraphQlError[];
  let partial = true;
  let unbind = () => {};

  if (query) {
    ({ data, partial } = client.read(query, variables));

    unbind = client.listen((shouldUpdate) => {
      if (!state.loading && shouldUpdate) {
        ({ data, partial } = client.read(query, variables));

        state.loaded = !partial;
        updater(getState());
      }
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

        return client.execute(mutationQuery, mutationVariables).then((response) => {
          if (query && update && response.data) {
            client.write(query, variables, update(clone(data), response.data));
          }

          return response;
        });
      };
    }
  }

  let getState = () => ({ ...state, ...boundMutations, ...(data as {}) });

  let loading = !!query && !skip && partial;
  let state = { loaded: !partial, loading };

  if (loading) load();

  function load(nextVariables?: CP["query"]["_variablesType"]) {
    variables = nextVariables ?? variables;

    if (!state.loading) {
      state.loading = true;
      updater(getState());
    }

    return client.execute(query, variables).then((res) => {
      ({ data, errors } = res);

      if (data) client.write(query, variables, data);

      state = { loaded: !!data, loading: false, ...(errors && { errors }) };
      updater(getState());
    });
  }

  return { unbind, getState, load };
}
