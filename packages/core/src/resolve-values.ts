import { GrafooPath, GrafooQuery, GrafooRecords, GrafooSelection } from "./types";
import { getPathId, resolveSelection } from "./util";

export default function resolveValues<T extends GrafooQuery>(
  { operation, fragments }: T,
  variables: T["_variablesType"],
  allPaths: GrafooPath,
  allRecords: GrafooRecords
) {
  let data = {} as T["_queryType"];
  let records: GrafooRecords = {};
  let partial = false;
  let stack: [string, GrafooSelection, GrafooPath, T["_queryType"]][] = [
    [, operation, allPaths, data]
  ];

  while (stack.length) {
    let [name, select, path, data] = stack.shift();

    if (Array.isArray(path)) {
      for (let [k, v] of Object.entries(path)) {
        data[k] = v !== null ? (Array.isArray(v) ? [] : {}) : null;
        stack.unshift([name, select, v, data[k]]);
      }
    } else {
      let currentSelect = resolveSelection(select, fragments);
      let { id } = path;
      let record = allRecords[id];

      if (id) {
        records[id] = record;

        for (let s of currentSelect.scalars) {
          data[s] = record[s];
        }
      }

      for (let [k, v] of Object.entries(currentSelect.select)) {
        let pathId = getPathId(k, v.args, variables);
        let newPath = path[pathId];

        if (newPath === undefined) {
          partial = true;
        } else {
          data[k] = newPath !== null ? (Array.isArray(path[pathId]) ? [] : {}) : null;
          if (newPath) stack.unshift([k, v, newPath, data[k]]);
        }
      }
    }
  }

  return { data, records, partial };
}
