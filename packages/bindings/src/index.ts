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

  const cacheOperation = { query, variables };

  let cachedState: { data?: {}; objects?: ObjectsMap } = {};

  // tslint:disable-next-line: no-empty
  let unbind = () => {};

  let lockUpdate = false;

  if (query) {
    cachedState = client.read(cacheOperation);

    unbind = client.listen(nextObjects => {
      if (lockUpdate) return (lockUpdate = false);

      if (!shallowEqual(nextObjects, cachedState.objects || {})) {
        const { data, objects } = client.read(cacheOperation);

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

      renderProps[key] = (variables: Variables) => {
        if (mutation.optimisticUpdate) {
          client.write(cacheOperation, mutation.optimisticUpdate(renderProps, variables));
        }

        const mutate = <T>(variables: Variables): Promise<T> =>
          client.request({ query: mutation.query.query, variables });

        return mutation.update(Object.assign({ mutate }, renderProps), variables).then(update => {
          client.write(cacheOperation, update);
        });
      };
    }
  }

  return {
    unbind,
    getState() {
      return renderProps;
    },
    executeQuery() {
      let queryString = query.query;

      if (query.frags) {
        for (const frag in query.frags) {
          queryString += query.frags[frag];
        }
      }

      return client
        .request({ query: queryString, variables })
        .then(response => {
          lockUpdate = true;

          client.write(cacheOperation, response);

          const { data, objects } = client.read(cacheOperation);

          cachedState.objects = objects;

          updater(Object.assign(renderProps, data, { loading: false, loaded: true }));
        })
        .catch(({ errors }) => {
          updater(Object.assign(renderProps, { errors, loading: false, loaded: true }));
        });
    }
  };
}
