import {
  GrafooClient,
  GrafooBindings,
  GrafooBoundMutations,
  GrafooConsumerProps,
  ObjectsMap
} from "@grafoo/types";

export default function createBindings<T = {}, U = {}>(
  client: GrafooClient,
  props: GrafooConsumerProps<T, U>,
  updater: () => void
): GrafooBindings<T, U> {
  let data: T;
  let objects: ObjectsMap;
  let boundMutations = {} as GrafooBoundMutations<U>;
  let unbind = () => {};
  let lockListenUpdate = 0;
  let loaded = false;
  let partial = false;

  if (props.query) {
    ({ data, objects, partial } = client.read<T>(props.query, props.variables));

    loaded = !!data && !partial;

    unbind = client.listen(nextObjects => {
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

      boundMutations[key] = mutationVariables => {
        if (props.query && optimisticUpdate) {
          writeToCache(optimisticUpdate(data, mutationVariables));
        }

        return client
          .execute<U[typeof key]>(mutationQuery, mutationVariables)
          .then(mutationResponse => {
            if (props.query && update && mutationResponse.data) {
              writeToCache(update(data, mutationResponse.data));
            }

            return mutationResponse;
          });
      };
    }
  }

  function writeToCache(dataUpdate: T) {
    client.write(props.query, props.variables, dataUpdate);
  }

  function performUpdate(boundStateUpdate?) {
    ({ data, objects } = client.read<T>(props.query, props.variables));

    Object.assign(boundState, boundStateUpdate);

    updater();
  }

  function getState() {
    return Object.assign({ client }, boundState, boundMutations, data);
  }

  function load() {
    if (!boundState.loading) {
      Object.assign(boundState, { loading: true });

      updater();
    }

    return client.execute<T>(props.query, props.variables).then(({ data, errors }) => {
      if (data) {
        lockListenUpdate = 1;

        writeToCache(data);
      }

      performUpdate({ errors, loaded: !!data, loading: false });
    });
  }

  return { getState, unbind, load };
}
