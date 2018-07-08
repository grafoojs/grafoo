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
  let { query, variables, mutations, skip } = props;
  let data: T;
  let objects: ObjectsMap;
  let boundMutations = {} as GrafooBoundMutations<U>;
  let unbind = () => {};
  let lockListenUpdate = 0;
  let loaded = false;

  if (query) {
    ({ data, objects } = client.read<T>(query, variables));

    for (let path in query.paths) loaded = !!data && !!data[query.paths[path].name];

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

  let boundState = query ? { load, loaded, loading: !skip && !loaded } : {};

  if (mutations) {
    for (let key in mutations) {
      let { update, optimisticUpdate, query: mutationQuery } = mutations[key];

      boundMutations[key] = mutationVariables => {
        if (query && optimisticUpdate) {
          writeToCache(optimisticUpdate(data, mutationVariables));
        }

        return client
          .execute<U[typeof key]>(mutationQuery, mutationVariables)
          .then(mutationResponse => {
            if (query && update && mutationResponse.data) {
              writeToCache(update(data, mutationResponse.data));
            }

            return mutationResponse;
          });
      };
    }
  }

  function writeToCache(dataUpdate: T) {
    client.write(query, variables, dataUpdate);
  }

  function performUpdate(boundStateUpdate?) {
    ({ data, objects } = client.read<T>(query, variables));

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

    return client.execute<T>(query, variables).then(({ data, errors }) => {
      if (data) {
        lockListenUpdate = 1;

        writeToCache(data);
      }

      performUpdate({ errors, loaded: !!data, loading: false });
    });
  }

  return { getState, unbind, load };
}
