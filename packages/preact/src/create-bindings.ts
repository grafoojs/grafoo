import { assign, shallowEqual } from "@grafoo/util";
import { Bindings, Context, QueryProps, QueryRenderProps } from "./types";

export default function createBindings(
  { query, variables, skipCache }: QueryProps,
  { client }: Context
): Bindings {
  const request = { query, variables };

  const { data, objects: objectsMap } = client.read(request);

  const state: QueryRenderProps =
    data && !skipCache
      ? assign({ loading: false, loaded: true }, data)
      : { loading: true, loaded: false };

  let lockUpdate = false;

  return {
    get state() {
      return state;
    },
    update(nextObjects, cb) {
      if (lockUpdate) return (lockUpdate = false);

      if (!state.objects) return;

      if (!shallowEqual(nextObjects, objectsMap)) {
        const { data, objects } = client.read(request);

        assign(objectsMap, objects);

        assign(state, data);

        cb();
      }
    },
    executeQuery(cb) {
      return client
        .request({ query: query.query, variables })
        .then(response => {
          lockUpdate = true;

          client.write(request, response);

          const { data, objects } = client.read(request);

          assign(objectsMap || {}, objects);

          assign(state, { loading: false, loaded: true }, data);

          cb();
        })
        .catch(({ errors }) => {
          assign(state, { errors });

          cb();
        });
    }
  };
}
