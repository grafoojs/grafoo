import {
  GrafooBindings,
  ClientInstance,
  GrafooConsumerProps,
  GrafooRenderProps,
  ObjectsMap,
  GrafooRenderMutations
} from "@grafoo/types";

function shouldUpdate(nextObjects: ObjectsMap, objects?: ObjectsMap) {
  objects = objects || {};

  for (let i in nextObjects) {
    if (!(i in objects)) return 1;

    for (let j in nextObjects[i]) if (nextObjects[i][j] !== objects[i][j]) return 1;
  }

  for (let i in objects) if (!(i in nextObjects)) return 1;
}

export default function createBindings<T = {}, U = {}>(
  client: ClientInstance,
  props: GrafooConsumerProps<T, U>,
  updater: () => void
): GrafooBindings<T, U> {
  let { query, variables, mutations, skip } = props;
  let data: {};
  let objects: ObjectsMap;
  let unbind = () => {};
  let lockUpdate = 0;

  if (query) {
    ({ data, objects } = readFromCache());

    unbind = client.listen(nextObjects => {
      if (lockUpdate) return (lockUpdate = 0);

      if (shouldUpdate(nextObjects, objects)) performUpdate();
    });
  }

  let cacheLoaded = !skip && data;
  let state = (query
    ? { load, loaded: !!cacheLoaded, loading: !cacheLoaded }
    : {}) as GrafooRenderProps;
  let queryResult = {} as T;
  let mutationFns = {} as GrafooRenderMutations<U>;

  if (cacheLoaded) Object.assign(queryResult, data);

  if (mutations) {
    for (let key in mutations) {
      let { update, optimisticUpdate, query: mutationQuery } = mutations[key];

      mutationFns[key] = mutationVariables => {
        if (query && optimisticUpdate) {
          writeToCache(optimisticUpdate(queryResult, mutationVariables));
        }

        return client.request<U[typeof key]>(mutationQuery, mutationVariables).then(data => {
          if (query && update) {
            writeToCache(update(queryResult, data));
          }

          return data;
        });
      };
    }
  }

  function writeToCache(data) {
    client.write(query, variables, data);
  }

  function readFromCache() {
    return client.read<T>(query, variables);
  }

  function performUpdate(stateUpdate?) {
    ({ data, objects } = readFromCache());

    Object.assign(queryResult, data);
    Object.assign(state, stateUpdate);

    updater();
  }

  function getState() {
    return Object.assign({ client }, state, queryResult, mutationFns);
  }

  function load() {
    if (!state.loading) {
      Object.assign(state, { loading: true });

      updater();
    }

    return client
      .request(query, variables)
      .then(response => {
        lockUpdate = 1;

        writeToCache(response);

        performUpdate({ loading: false, loaded: true });
      })
      .catch(({ errors }) => {
        Object.assign(state, { errors, loading: false, loaded: true });

        updater();
      });
  }

  return { getState, unbind, load };
}
