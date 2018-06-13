import {
  Bindings,
  ClientInstance,
  GrafooConsumerProps,
  GrafooRenderProps,
  Variables,
  ObjectsMap
} from "@grafoo/types";

export default function createBindings(
  client: ClientInstance,
  props: GrafooConsumerProps,
  updater: () => void
): Bindings {
  let { query, variables, mutations, skip } = props;

  let writeToCache = data => client.write(query, variables, data);
  let readFromCache = () => client.read(query, variables);

  let cachedState: { data?: {}; objects?: ObjectsMap } = {};

  // tslint:disable-next-line: no-empty
  let unbind = () => {};

  let lockUpdate = false;

  function performUpdate(additionalData?) {
    let { data, objects } = readFromCache();

    cachedState.objects = objects;

    Object.assign(state, data, additionalData);

    updater();
  }

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

  let state: GrafooRenderProps = {
    client,
    load,
    loaded: !!cacheLoaded,
    loading: !cacheLoaded
  };

  if (cacheLoaded) Object.assign(state, cachedState.data);

  if (mutations) {
    for (let key in mutations) {
      let mutation = mutations[key];

      state[key] = (mutationVariables: Variables) => {
        if (mutation.optimisticUpdate) {
          writeToCache(mutation.optimisticUpdate(state, mutationVariables));
        }

        return client.request(mutation.query, mutationVariables).then(data => {
          writeToCache(mutation.update(state, data));
        });
      };
    }
  }

  function getState() {
    return state;
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
