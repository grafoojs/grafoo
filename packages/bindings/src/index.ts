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

  let writeToCache = data => client.write(query, variables, data);
  let readFromCache = () => client.read(query, variables);

  let cachedState: { data?: {}; objects?: ObjectsMap } = {};

  let unbind = () => {};

  let lockUpdate = false;

  let performUpdate = (additionalData?) => {
    let { data, objects } = readFromCache();

    cachedState.objects = objects;

    Object.assign(queryResult, data);
    Object.assign(state, additionalData);

    updater();
  };

  if (query) {
    cachedState = readFromCache();

    unbind = client.listen(nextObjects => {
      if (lockUpdate) return (lockUpdate = false);

      let cachedObjects = cachedState.objects || {};

      for (let i in nextObjects) if (nextObjects[i] !== cachedObjects[i]) return performUpdate();
      for (let i in cachedObjects) if (!(i in nextObjects)) return performUpdate();
    });
  }

  let cacheLoaded = cachedState.data && !skip;

  let state: GrafooRenderProps = query
    ? { load, loaded: !!cacheLoaded, loading: !cacheLoaded }
    : {};
  let queryResult = {} as T;
  let mutationFns = {} as GrafooRenderMutations<U>;

  if (cacheLoaded) Object.assign(state, cachedState.data);

  if (mutations) {
    for (let key in mutations) {
      let mutation = mutations[key];

      mutationFns[key] = mutationVariables => {
        if (query && mutation.optimisticUpdate) {
          writeToCache(mutation.optimisticUpdate(queryResult, mutationVariables));
        }

        return client.request(mutation.query, mutationVariables).then((data: U[typeof key]) => {
          if (query && mutation.update) {
            writeToCache(mutation.update(queryResult, data));
          }

          return data;
        });
      };
    }
  }

  function getState() {
    return Object.assign({}, state, queryResult, mutationFns);
  }

  function load() {
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
