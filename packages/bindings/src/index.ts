import {
  Bindings,
  ClientInstance,
  GrafooConsumerProps,
  GrafooRenderProps,
  Variables,
  ObjectsMap
} from "@grafoo/types";

const shallowEqual = (a: {}, b: {}) => {
  for (const i in a) if (a[i] !== b[i]) return false;
  for (const i in b) if (!(i in a)) return false;
  return true;
};

export default function createBindings(
  client: ClientInstance,
  props: GrafooConsumerProps,
  updater: () => void
): Bindings {
  const { query, variables, mutations, skip } = props;

  const writeToCache = data => client.write(query, variables, data);
  const readFromCache = () => client.read(query, variables);

  let cachedState: { data?: {}; objects?: ObjectsMap } = {};

  // tslint:disable-next-line: no-empty
  let unbind = () => {};

  let lockUpdate = false;

  if (query) {
    cachedState = readFromCache();

    unbind = client.listen(nextObjects => {
      if (lockUpdate) return (lockUpdate = false);

      if (!shallowEqual(nextObjects, cachedState.objects || {})) {
        const { data, objects } = readFromCache();

        cachedState.objects = objects;

        Object.assign(state, data);

        updater();
      }
    });
  }

  const cacheLoaded = cachedState.data && !skip;

  const state: GrafooRenderProps = { loading: !cacheLoaded, loaded: !!cacheLoaded };

  if (cacheLoaded) Object.assign(state, cachedState.data);

  if (mutations) {
    for (const key in mutations) {
      const mutation = mutations[key];

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

        const { data, objects } = readFromCache();

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
