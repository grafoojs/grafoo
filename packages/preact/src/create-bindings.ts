import { ClientInstance } from "@grafoo/core";
import { Variables } from "@grafoo/transport";
import { assign, shallowEqual } from "@grafoo/util";
import { Bindings, GrafooConsumerProps, GrafooRenderProps } from "./types";

export default function createBindings(
  props: GrafooConsumerProps,
  client: ClientInstance,
  updater: () => void
): Bindings {
  const { query, variables, mutations, skipCache } = props;

  const cacheOperation = { query, variables };

  const cachedState = client.read(cacheOperation);

  const { data } = cachedState;

  const objectsMap = cachedState || {};

  const mutationActions = {};

  const cacheLoaded = data && !skipCache;

  const state: GrafooRenderProps = { loading: !cacheLoaded, loaded: cacheLoaded };

  if (cacheLoaded) assign(state, data);

  if (mutations) {
    for (const key in mutations) {
      const mutation = mutations[key];

      mutationActions[key] = (variables: Variables) => {
        if (mutation.optmisticUpdate) {
          client.write(cacheOperation, mutation.optmisticUpdate(state, variables));
        }

        const mutate = <T>(variables: Variables): Promise<T> =>
          client.request({ query: mutation.query.query, variables });

        return mutation.update(assign({ mutate }, state), variables).then(update => {
          client.write(cacheOperation, update);
        });
      };
    }
  }

  let lockUpdate = false;

  return {
    getState() {
      return assign({}, state, mutationActions);
    },
    update(nextObjects) {
      if (lockUpdate) return (lockUpdate = false);

      if (!Object.keys(objectsMap).length) return;

      if (!shallowEqual(nextObjects, objectsMap)) {
        const { data, objects } = client.read(cacheOperation);

        assign(objectsMap, objects);

        assign(state, data);

        updater();
      }
    },
    executeQuery() {
      client
        .request({ query: query.query, variables })
        .then(response => {
          lockUpdate = true;

          client.write(cacheOperation, response);

          const { data, objects } = client.read(cacheOperation);

          assign(objectsMap, objects);

          assign(state, data, { loading: false, loaded: true });

          updater();
        })
        .catch(({ errors }) => {
          assign(state, { errors, loading: false, loaded: true });

          updater();
        });
    }
  };
}
