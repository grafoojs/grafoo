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
import { deepMerge } from "./util";

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

    // run listeners
    for (let i in listeners) listeners[i](shouldUpdate(result.records));

    // update paths and records
    deepMerge(paths, result.paths);
    deepMerge(records, result.records);
  }

  function shouldUpdate(nextRecords: GrafooRecords) {
    for (let i in nextRecords) {
      // record has been inserted
      if (!(i in records)) return true;

      for (let j in nextRecords[i]) {
        // record has been updated
        if (nextRecords[i][j] !== records[i][j]) return true;
      }
    }

    for (let i in records) {
      // record has been removed
      if (!(i in nextRecords)) return true;
    }

    return false;
  }

  function read<T extends GrafooQuery>(query: T, variables?: T["_variablesType"]) {
    return resolveValues(query, variables, paths, records);
  }

  function extract() {
    return { records, paths };
  }

  function reset() {
    paths = {};
    records = {};
  }

  return { execute, listen, write, read, extract, reset };
}
