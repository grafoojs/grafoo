import {
  Bindings,
  ClientInstance,
  GrafooConsumerProps,
  GrafooRenderProps,
  Variables,
  ObjectsMap
} from "@grafoo/types";

let shallowEqual = (a: {}, b: {}) => {
  for (let i in a) if (a[i] !== b[i]) return false;
  for (let i in b) if (!(i in a)) return false;
  return true;
};

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

  if (query) {
    cachedState = readFromCache();

    unbind = client.listen(nextObjects => {
      if (lockUpdate) return (lockUpdate = false);

      if (!shallowEqual(nextObjects, cachedState.objects || {})) {
        let { data, objects } = readFromCache();

        cachedState.objects = objects;

        Object.assign(state, data);

        updater();
      }
    });
  }

  let cacheLoaded = cachedState.data && !skip;

  let state: GrafooRenderProps = { loading: !cacheLoaded, loaded: !!cacheLoaded };

  if (cacheLoaded) Object.assign(state, cachedState.data);

  if (mutations) {
    for (let key in mutations) {
      let mutation = mutations[key];

      state[key] = (mutationVariables: Variables) => {
        if (mutation.optimisticUpdate) {
          writeToCache(mutation.optimisticUpdate(state, mutationVariables));
        }

        return client
          .request(mutation.query, mutationVariables)
          .then(data => writeToCache(mutation.update(state, data)));
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

        let { data, objects } = readFromCache();

        cachedState.objects = objects;

        Object.assign(state, data, { loading: false, loaded: true });

        updater();
      })
      .catch(({ errors }) => {
        Object.assign(state, { errors, loading: false, loaded: true });

        updater();
      });
  }

  return { getState, unbind, load };
}
