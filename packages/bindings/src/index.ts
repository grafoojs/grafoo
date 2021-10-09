import {
  GrafooClient,
  GrafooRecords,
  GraphQlError,
  GraphQlPayload,
  GrafooQuery
} from "@grafoo/core";

export type GrafooBoundMutations<T extends Record<string, GrafooQuery>> = {
  [U in keyof T]: (
    variables: T[U]["_variablesType"]
  ) => Promise<GraphQlPayload<T[U]["_queryType"]>>;
};

export type GrafooBoundState = {
  loaded?: boolean;
  loading?: boolean;
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
  variables?: T["_variablesType"];
  mutations?: GrafooMutations<T, U>;
  skip?: boolean;
};

export default function createBindings<
  T extends GrafooQuery,
  U extends Record<string, GrafooQuery>
>(client: GrafooClient, updater: () => void, props: GrafooConsumerProps<T, U>) {
  type CP = GrafooConsumerProps<T, U>;
  let { query, variables, mutations, skip } = props;
  let data: CP["query"]["_queryType"];
  let boundMutations = {} as GrafooBoundMutations<U>;
  let records: GrafooRecords;
  let partial = false;
  let unbind = () => {};
  let lockListenUpdate = false;
  let loaded = false;

  if (query) {
    ({ data, records, partial } = client.read(query, variables));

    loaded = !!data && !partial;

    unbind = client.listen((nextRecords) => {
      if (lockListenUpdate) return (lockListenUpdate = false);

      records = records || {};

      for (let i in nextRecords) {
        // record has been inserted
        if (!(i in records)) return performUpdate();

        for (let j in nextRecords[i]) {
          // record has been updated
          if (nextRecords[i][j] !== records[i][j]) return performUpdate();
        }
      }

      for (let i in records) {
        // record has been removed
        if (!(i in nextRecords)) return performUpdate();
      }
    });
  }

  let boundState: GrafooBoundState = { loaded, loading: !!query && !skip && !loaded };

  if (mutations) {
    for (let key in mutations) {
      let { update, optimisticUpdate, query: mutationQuery } = mutations[key];

      boundMutations[key] = (mutationVariables) => {
        if (query && optimisticUpdate) {
          writeToCache({ data: optimisticUpdate(data, mutationVariables) });
        }

        return client.execute(mutationQuery, mutationVariables).then((mutationResponse) => {
          if (query && update && mutationResponse.data) {
            writeToCache({ data: update(data, mutationResponse.data) });
          }

          return mutationResponse;
        });
      };
    }
  }

  function writeToCache(dataUpdate: { data: CP["query"]["_queryType"] }) {
    client.write(query, variables, dataUpdate);
  }

  function performUpdate(boundStateUpdate?: GrafooBoundState) {
    ({ data, records } = client.read(query, variables));

    Object.assign(boundState, boundStateUpdate);
    updater();
  }

  function getState() {
    return Object.assign({}, boundState, boundMutations, data);
  }

  function load(nextVariables?: CP["query"]["_variablesType"]) {
    if (nextVariables) {
      variables = nextVariables;
    }

    if (!boundState.loading) {
      Object.assign(boundState, { loading: true });
      updater();
    }

    return client.execute(query, variables).then(({ data, errors }) => {
      if (data) {
        lockListenUpdate = true;
        writeToCache({ data });
      }

      performUpdate(Object.assign({ loaded: !!data, loading: false }, errors && { errors }));
    });
  }

  return { getState, unbind, load };
}
