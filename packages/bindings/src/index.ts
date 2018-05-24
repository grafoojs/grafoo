import {
  Bindings,
  ClientInstance,
  GrafooConsumerProps,
  GrafooRenderProps,
  Variables
} from "@grafoo/types";
import { assign, shallowEqual } from "@grafoo/util";

export default function createBindings(
  props: GrafooConsumerProps,
  client: ClientInstance,
  updater: (renderProps: GrafooRenderProps) => void
): Bindings {
  const { query, variables, mutations, skip } = props;

  const cacheOperation = { query, variables };

  const cachedState = query ? client.read(cacheOperation) : {};

  const { data } = cachedState;

  let objectsMap = cachedState.objects || {};

  let lockUpdate = false;

  const cacheLoaded = data && !skip;

  const renderProps: GrafooRenderProps = { loading: !cacheLoaded, loaded: !!cacheLoaded };

  if (cacheLoaded) assign(renderProps, data);

  if (mutations) {
    for (const key in mutations) {
      const mutation = mutations[key];

      renderProps[key] = (variables: Variables) => {
        if (mutation.optimisticUpdate) {
          client.write(cacheOperation, mutation.optimisticUpdate(renderProps, variables));
        }

        const mutate = <T>(variables: Variables): Promise<T> =>
          client.request({ query: mutation.query.query, variables });

        return mutation.update(assign({ mutate }, renderProps), variables).then(update => {
          client.write(cacheOperation, update);
        });
      };
    }
  }

  return {
    getState() {
      return renderProps;
    },
    update(nextObjects) {
      if (lockUpdate) return (lockUpdate = false);

      if (!Object.keys(objectsMap).length) return;

      if (!shallowEqual(nextObjects, objectsMap)) {
        const { data, objects } = client.read(cacheOperation);

        objectsMap = objects;

        updater(data);
      }
    },
    executeQuery() {
      let queryString = query.query;

      if (query.frags) {
        for (const frag in query.frags) {
          queryString += query.frags[frag];
        }
      }

      client
        .request({ query: queryString, variables })
        .then(response => {
          lockUpdate = true;

          client.write(cacheOperation, response);

          const { data, objects } = client.read(cacheOperation);

          objectsMap = objects;

          updater(assign({}, data, { loading: false, loaded: true }));
        })
        .catch(({ errors }) => {
          updater({ errors, loading: false, loaded: true });
        });
    }
  };
}
