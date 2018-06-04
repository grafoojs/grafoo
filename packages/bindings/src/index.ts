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
  updater: (renderProps: GrafooRenderProps) => void
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

        updater(Object.assign(renderProps, data));
      }
    });
  }

  const cacheLoaded = cachedState.data && !skip;

  const renderProps: GrafooRenderProps = { loading: !cacheLoaded, loaded: !!cacheLoaded };

  if (cacheLoaded) Object.assign(renderProps, cachedState.data);

  if (mutations) {
    for (const key in mutations) {
      const mutation = mutations[key];

      renderProps[key] = (mutationVariables: Variables) => {
        if (mutation.optimisticUpdate) {
          writeToCache(mutation.optimisticUpdate(renderProps, mutationVariables));
        }

        const mutate = <T>(mutateVariables: Variables): Promise<T> =>
          client.request<T>(mutation.query, mutateVariables);

        return mutation
          .update(Object.assign({ mutate }, renderProps), mutationVariables)
          .then(update => writeToCache(update));
      };
    }
  }

  return {
    unbind,
    getState() {
      return renderProps;
    },
    executeQuery() {
      return client
        .request(query, variables)
        .then(response => {
          lockUpdate = true;

          writeToCache(response);

          const { data, objects } = readFromCache();

          cachedState.objects = objects;

          updater(Object.assign(renderProps, data, { loading: false, loaded: true }));
        })
        .catch(({ errors }) => {
          updater(Object.assign(renderProps, { errors, loading: false, loaded: true }));
        });
    }
  };
}
