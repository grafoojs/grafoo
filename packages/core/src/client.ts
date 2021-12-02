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
  options: GrafooClientOptions
): GrafooClient {
  let { initialState, idFields } = options;
  let paths: GrafooPath = initialState?.paths ?? {};
  let records: GrafooRecords = initialState?.records ?? {};
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

    let shouldUpdate = false;
    for (let i in result.records) {
      // record has been inserted
      if (!(i in records)) shouldUpdate = true;

      for (let j in result.records[i]) {
        // record has been updated
        if (result.records[i][j] !== records[i]?.[j]) shouldUpdate = true;
      }
    }

    for (let i in records) {
      // record has been removed
      if (!(i in result.records)) shouldUpdate = true;
    }

    // update paths and records
    deepMerge(paths, result.paths);
    deepMerge(records, result.records);

    // run listeners
    for (let i in listeners) listeners[i](shouldUpdate);
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
