import { assign, shallowEqual } from "@grafoo/util";
import { Bindings, Context, QueryProps, QueryRenderProps } from "./types";

export default function createBindings(props: QueryProps, context: Context): Bindings {
  const { query, variables, skipCache } = props;
  const { client } = context;
  const request = { query, variables };
  const cachedQuery = client.read(request);
  const state: QueryRenderProps =
    cachedQuery && !skipCache ? assign({ loading: false }, cachedQuery) : { loading: true };

  let lockUpdate = false;

  return {
    get state() {
      return state;
    },
    update(nextObjects, cb) {
      if (lockUpdate) return (lockUpdate = false);

      if (!state.objects) return;

      if (!shallowEqual(nextObjects, state.objects)) {
        assign(state, client.read(request));

        cb();
      }
    },
    executeQuery(cb) {
      return client.request({ query: query.query, variables }).then(data => {
        lockUpdate = true;

        client.write(request, data);

        assign(state, { loading: false }, client.read(request));

        cb();
      });
    }
  };
}
