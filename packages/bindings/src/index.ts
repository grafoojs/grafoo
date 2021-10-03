import {
  GrafooClient,
  GrafooObjectsMap,
  GraphQlError,
  GraphQlPayload,
  GrafooObject
} from "@grafoo/core";

export type GrafooMutation<T extends GrafooObject, U extends GrafooObject> = {
  query: T;
  update?: (props: U["_queryType"], data: T["_queryType"]) => T["_queryType"];
  optimisticUpdate?: (props: U["_queryType"], variables: T["_variablesType"]) => T["_queryType"];
};

export type GrafooMutations<T extends GrafooObject> = {
  [k: string]: GrafooMutation<GrafooObject, T>;
};

export type GrafooBountMutations<T extends GrafooObject, U extends GrafooMutations<T>> = {
  [V in keyof U]: (
    variables: U[V]["query"]["_variablesType"]
  ) => Promise<GraphQlPayload<U[V]["query"]["_queryType"]>>;
};

export type GrafooConsumerProps<T extends GrafooObject, U extends GrafooMutations<T>> = {
  query?: T;
  variables?: T["_variablesType"];
  mutations?: U;
  skip?: boolean;
};

export default function createBindings<T extends GrafooObject, U extends GrafooMutations<T>>(
  client: GrafooClient,
  updater: () => void,
  props: GrafooConsumerProps<T, U>
) {
  type CP = GrafooConsumerProps<T, U>;

  let { variables } = props;
  let data: CP["query"]["_queryType"];
  let objects: GrafooObjectsMap;
  let partial = false;
  let boundMutations = {} as GrafooBountMutations<CP["query"], CP["mutations"]>;
  let unbind = () => {};
  let lockListenUpdate = false;
  let loaded = false;

  if (props.query) {
    ({ data, objects, partial } = client.read(props.query, variables));

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

  let boundState = props.query ? { load, loaded, loading: !props.skip && !loaded } : {};

  if (props.mutations) {
    for (let key in props.mutations) {
      let { update, optimisticUpdate, query: mutationQuery } = props.mutations[key];

      boundMutations[key] = (mutationVariables) => {
        if (props.query && optimisticUpdate) {
          writeToCache(optimisticUpdate(data, mutationVariables));
        }

        return client.execute(mutationQuery, mutationVariables).then((mutationResponse) => {
          if (props.query && update && mutationResponse.data) {
            writeToCache(update(data, mutationResponse.data));
          }

          return mutationResponse;
        });
      };
    }
  }

  function writeToCache(dataUpdate: CP["query"]["_queryType"]) {
    client.write(props.query, variables, dataUpdate);
  }

  function performUpdate(boundStateUpdate?: {
    errors: GraphQlError[];
    loaded: boolean;
    loading: boolean;
  }) {
    ({ data, objects } = client.read(props.query, variables));

    Object.assign(boundState, boundStateUpdate);

    updater();
  }

  function getState() {
    return Object.assign({ client }, boundState, boundMutations, data);
  }

  function load(nextVariables?: CP["query"]["_variablesType"]) {
    if (nextVariables) {
      variables = nextVariables;
    }

    if (!boundState.loading) {
      Object.assign(boundState, { loading: true });

      updater();
    }

    return client.execute(props.query, variables).then(({ data, errors }) => {
      if (data) {
        lockListenUpdate = true;

        writeToCache(data);
      }
      performUpdate({ errors, loaded: !!data, loading: false });
    });
  }

  return { getState, unbind, load };
}
