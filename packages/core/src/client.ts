import storeValues from "./store-values";
import resolveValues from "./resolve-values";
import {
  GrafooClient,
  GrafooClientOptions,
  GrafooListener,
  GrafooPath,
  GrafooQuery,
  GrafooRecords,
  GrafooTransport
} from "./types";

export default function createClient(
  transport: GrafooTransport,
  options?: GrafooClientOptions
): GrafooClient {
  let { initialState = { paths: {}, records: {} }, idFields } = options;
  let paths: GrafooPath = initialState.paths ?? {};
  let records: GrafooRecords = initialState.records ?? {};
  let listeners: GrafooListener[] = [];

  function execute<T extends GrafooQuery>(query: T, variables?: T["_variablesType"]) {
    return transport<T>(query.document, variables);
  }

  function listen(listener: GrafooListener) {
    listeners.push(listener);
    return () => {
      let index = listeners.indexOf(listener);
      if (index < 0) return;
      listeners.splice(index, 1);
    };
  }

  function write<T extends GrafooQuery>(
    query: T,
    variables: T["_variablesType"],
    data?: T["_queryType"]
  ) {
    if (!data) {
      data = variables as T["_queryType"];
      variables = {};
    }

    let result = storeValues(query, variables, data, idFields);
    let queryRecords = result.records;
    Object.assign(paths, result.path);

    // assign new values to records
    for (let i in queryRecords) {
      Object.assign(records, { [i]: { ...records[i], ...queryRecords[i] } });
    }

    // run listeners
    for (let i in listeners) listeners[i](queryRecords);
  }

  function read<T extends GrafooQuery>(query: T, variables?: T["_variablesType"]) {
    return resolveValues(query, variables, paths, records);
  }

  function flush() {
    return { records, paths };
  }

  function reset() {
    paths = {};
    records = {};
  }

  return { execute, listen, write, read, flush, reset };
}
