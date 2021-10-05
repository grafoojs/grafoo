import {
  GrafooClient,
  GrafooObjectsMap,
  GraphQlError,
  GraphQlPayload,
  GrafooObject
} from "@grafoo/core";

export type GrafooBoundMutations<T extends Record<string, GrafooObject>> = {
  [U in keyof T]: (
    variables: T[U]["_variablesType"]
  ) => Promise<GraphQlPayload<T[U]["_queryType"]>>;
};

export type GrafooBoundState = {
  loaded?: boolean;
  loading?: boolean;
  errors?: GraphQlError[];
};

export type GrafooMutation<T extends GrafooObject, U extends GrafooObject> = {
  query: U;
  update?: (props: T["_queryType"], data: U["_queryType"]) => T["_queryType"];
  optimisticUpdate?: (props: T["_queryType"], variables: U["_variablesType"]) => T["_queryType"];
};

export type GrafooConsumerProps<T extends GrafooObject, U extends Record<string, GrafooObject>> = {
  query?: T;
  variables?: T["_variablesType"];
  mutations?: {
    [V in keyof U]: GrafooMutation<T, U[V]>;
  };
  skip?: boolean;
};

export default function createBindings<
  T extends GrafooObject,
  U extends Record<string, GrafooObject>
>(client: GrafooClient, updater: () => void, props: GrafooConsumerProps<T, U>) {
  type CP = GrafooConsumerProps<T, U>;
  let { query, variables, mutations, skip } = props;
  let data: CP["query"]["_queryType"];
  let boundMutations = {} as GrafooBoundMutations<U>;
  let objects: GrafooObjectsMap;
  let partial = false;
  let unbind = () => {};
  let lockListenUpdate = false;
  let loaded = false;

  if (query) {
    ({ data, objects, partial } = client.read(query, variables));

    loaded = !!data && !partial;

    unbind = client.listen((nextObjects) => {
      if (lockListenUpdate) return (lockListenUpdate = false);

      objects = objects || {};

      for (let i in nextObjects) {
        // object has been inserted
        if (!(i in objects)) return performUpdate();

        for (let j in nextObjects[i]) {
          // object has been updated
          if (nextObjects[i][j] !== objects[i][j]) return performUpdate();
        }
      }

      for (let i in objects) {
        // object has been removed
        if (!(i in nextObjects)) return performUpdate();
      }
    });
  }

  let boundState: GrafooBoundState = { loaded, loading: !!query && !skip && !loaded };

  if (mutations) {
    for (let key in mutations) {
      let { update, optimisticUpdate, query: mutationQuery } = mutations[key];

      boundMutations[key] = (mutationVariables) => {
        if (query && optimisticUpdate) {
          writeToCache(optimisticUpdate(data, mutationVariables));
        }

        return client.execute(mutationQuery, mutationVariables).then((mutationResponse) => {
          if (query && update && mutationResponse.data) {
            writeToCache(update(data, mutationResponse.data));
          }

          return mutationResponse;
        });
      };
    }
  }

  function writeToCache(dataUpdate: CP["query"]["_queryType"]) {
    client.write(query, variables, dataUpdate);
  }

  function performUpdate(boundStateUpdate?: GrafooBoundState) {
    ({ data, objects } = client.read(query, variables));

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
        writeToCache(data);
      }

      performUpdate(Object.assign({ loaded: !!data, loading: false }, errors && { errors }));
    });
  }

  return { getState, unbind, load };
}
