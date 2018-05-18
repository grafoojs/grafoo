import { ClientInstance } from "@grafoo/core";
import { Variables } from "@grafoo/transport";
import { assign, shallowEqual } from "@grafoo/util";
import { Bindings, GrafooConsumerProps, GrafooRenderProps } from "./types";

export default function createBindings(
  { query, mutations, variables, skipCache }: GrafooConsumerProps,
  client: ClientInstance,
  cb: () => void
): Bindings {
  const cacheOperation = { query, variables };

  const { data, objects: objectsMap = {} } = client.read(cacheOperation);

  const state: GrafooRenderProps =
    data && !skipCache
      ? assign({ loading: false, loaded: true }, data)
      : { loading: true, loaded: false };

  let lockUpdate = false;

  for (const mut in mutations) {
    const mutation = mutations[mut];

    state[mut] = (variables: Variables) => {
      if (mutation.optmisticUpdate) {
        const optimisticUpdate = mutation.optmisticUpdate(state, variables);
        client.write(cacheOperation, optimisticUpdate);
      }

      const mutate = <T>(variables: Variables): Promise<T> =>
        client.request({ query: mutation.query.query, variables });

      return mutation.update(assign({ mutate }, state), variables).then(update => {
        client.write(cacheOperation, update);
      });
    };
  }

  return {
    getState() {
      return state;
    },
    update(nextObjects) {
      if (lockUpdate) return (lockUpdate = false);

      if (!Object.keys(objectsMap).length) return;

      if (!shallowEqual(nextObjects, objectsMap)) {
        const { data, objects } = client.read(cacheOperation);

        assign(objectsMap, objects);

        assign(state, data);

        cb();
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

          assign(state, { loading: false, loaded: true }, data);

          cb();
        })
        .catch(({ errors }) => {
          assign(state, { errors, loading: false, loaded: true });

          cb();
        });
    }
  };
}
