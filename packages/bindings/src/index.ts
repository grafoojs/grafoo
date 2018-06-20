import {
  GrafooBindings,
  ClientInstance,
  GrafooConsumerProps,
  GrafooRenderProps,
  ObjectsMap,
  GrafooRenderMutations
} from "@grafoo/types";

export default function createBindings<T = {}, U = {}>(
  client: ClientInstance,
  props: GrafooConsumerProps<T, U>,
  updater: () => void
): GrafooBindings<T, U> {
  let { query, variables, mutations, skip } = props;
  let cachedState: { data?: {}; objects?: ObjectsMap } = {};
  let unbind = () => {};
  let lockUpdate = false;

  if (query) {
    cachedState = readFromCache();

    unbind = client.listen(nextObjects => {
      if (lockUpdate) return (lockUpdate = false);

      let cachedObjects = cachedState.objects || {};

      for (let i in nextObjects) if (nextObjects[i] !== cachedObjects[i]) return performUpdate();
      for (let i in cachedObjects) if (!(i in nextObjects)) return performUpdate();
    });
  }

  let cacheLoaded = !skip && cachedState.data;
  let state = (query
    ? { load, loaded: !!cacheLoaded, loading: !cacheLoaded }
    : {}) as GrafooRenderProps;
  let queryResult = {} as T;
  let mutationFns = {} as GrafooRenderMutations<U>;

  if (cacheLoaded) Object.assign(queryResult, cachedState.data);

  if (mutations) {
    for (let key in mutations) {
      let mutation = mutations[key];

      mutationFns[key] = mutationVariables => {
        if (query && mutation.optimisticUpdate) {
          writeToCache(mutation.optimisticUpdate(queryResult, mutationVariables));
        }

        return client.request<U[typeof key]>(mutation.query, mutationVariables).then(data => {
          if (query && mutation.update) {
            writeToCache(mutation.update(queryResult, data));
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

  function performUpdate(additionalData?) {
    let { data, objects } = readFromCache();

    cachedState.objects = objects;

    Object.assign(queryResult, data);
    Object.assign(state, additionalData);

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
        lockUpdate = true;

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
