import {
  GrafooClient,
  GrafooBindings,
  GrafooBoundMutations,
  GrafooConsumerProps,
  ObjectsMap,
  Variables,
  GraphQlError,
  GraphQlPayload
} from "@grafoo/types";

export default function createBindings<T = unknown, U = unknown>(
  client: GrafooClient,
  props: GrafooConsumerProps<T, U>,
  updater: () => void
): GrafooBindings<T, U> {
  let { variables } = props;
  let data: T;
  let objects: ObjectsMap;
  let boundMutations = {} as GrafooBoundMutations<U>;
  let unbind = () => {};
  let lockListenUpdate = 0;
  let loaded = false;
  let partial = false;

  if (props.query) {
    ({ data, objects, partial } = client.read<T>(props.query, variables));

    loaded = !!data && !partial;

    unbind = client.listen((nextObjects) => {
      if (lockListenUpdate) return (lockListenUpdate = 0);

      objects = objects || {};

      for (let i in nextObjects) {
        // object has been inserted
        if (!(i in objects)) return performUpdate();

        for (let j in nextObjects[i]) {
          // object has been updated
          if (nextObjects[i][j] !== objects[i][j]) return performUpdate();
        }
      }

      for (let i in objects) {
        // object has been removed
        if (!(i in nextObjects)) return performUpdate();
      }
    });
  }

  let boundState = props.query ? { load, loaded, loading: !props.skip && !loaded } : {};

  if (props.mutations) {
    for (let key in props.mutations) {
      let { update, optimisticUpdate, query: mutationQuery } = props.mutations[key];

      boundMutations[key] = async (
        mutationVariables
      ): Promise<GraphQlPayload<U[Extract<keyof U, string>]>> => {
        if (props.query && optimisticUpdate) {
          writeToCache(optimisticUpdate(data, mutationVariables));
        }

        let mutationResponse = await client.execute<U[typeof key]>(
          mutationQuery,
          mutationVariables
        );
        if (props.query && update && mutationResponse.data) {
          writeToCache(update(data, mutationResponse.data));
        }
        return mutationResponse;
      };
    }
  }

  function writeToCache(dataUpdate: T) {
    client.write(props.query, variables, dataUpdate);
  }

  function performUpdate(boundStateUpdate?: {
    errors: GraphQlError[];
    loaded: boolean;
    loading: boolean;
  }) {
    ({ data, objects } = client.read<T>(props.query, variables));

    Object.assign(boundState, boundStateUpdate);

    updater();
  }

  function getState() {
    return Object.assign({ client }, boundState, boundMutations, data);
  }

  async function load(nextVariables?: Variables): Promise<void> {
    if (nextVariables) {
      variables = nextVariables;
    }

    if (!boundState.loading) {
      Object.assign(boundState, { loading: true });

      updater();
    }

    let { data, errors } = await client.execute<T>(props.query, variables);
    if (data) {
      lockListenUpdate = 1;

      writeToCache(data);
    }
    performUpdate({ errors, loaded: !!data, loading: false });
  }

  return { getState, unbind, load };
}
