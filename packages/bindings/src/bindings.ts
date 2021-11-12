import { GrafooClient, GrafooRecords, GraphQlError, GrafooQuery } from "@grafoo/core";
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
  let { query, variables, mutations, skip } = props;
  let data: CP["query"]["_queryType"];
  let errors: GraphQlError[];
  let boundMutations = {} as GrafooBoundMutations<U>;
  let records: GrafooRecords;
  let partial = false;
  let unbind = () => {};
  let preventListenUpdate = true;

  if (query) {
    ({ data, records, partial } = client.read(query, variables));

    unbind = client.listen((nextRecords) => {
      if (preventListenUpdate) return;

      for (let i in nextRecords) {
        // record has been inserted
        if (!(i in records)) return getUpdateFromClient();

        for (let j in nextRecords[i]) {
          // record has been updated
          if (nextRecords[i][j] !== records[i][j]) return getUpdateFromClient();
        }
      }

      for (let i in records) {
        // record has been removed
        if (!(i in nextRecords)) return getUpdateFromClient();
      }
    });
  }

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

  let state = { loaded: !!data && !partial, loading: !!query || !data || skip };

  function getUpdateFromClient() {
    ({ data, partial } = client.read(query, variables));
    Object.assign(state, { loaded: !!data && !partial });
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
