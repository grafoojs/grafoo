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
      client
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

// function createMUtation() {
//   const mutations = {};
//   const queryOp = { query: this.props.query, variables: this.props.variables };

//   for (const mut in this.props.mutations) {
//     const mutation = this.props.mutations[mut];

//     mutations[mut] = (...args) => {
//       const optimisticUp = mutation.optmisticUpdate(...args);

//       this.context.client.write(queryOp, optimisticUp);

//       const mutate = variables =>
//         this.context.client.request({ query: mutation.query.query, variables });

//       mutation.update(mutate, ...args).then(update => {
//         this.context.client.write(queryOp, update);
//       });
//     };
//   }

//   return mutations;
// }
