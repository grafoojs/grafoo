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
    ["", operation, allPaths, data]
  ];

  while (stack.length) {
    let [name, select, path, data] = stack.shift();

    if (!path) {
      partial = true;
      continue;
    }

    if (Array.isArray(path)) {
      for (let [k, v] of Object.entries(path)) {
        data[k] = Array.isArray(v) ? [] : {};
        stack.unshift([name, select, v, data[k]]);
      }
    } else {
      let currentSelection = resolveSelection(select, fragments);
      let { id } = path;
      let record = allRecords[id as string];

      if (id) {
        records[id as string] = record;

        for (let s of currentSelection.scalars) {
          data[s] = record[s];
        }
      }

      for (let [k, v] of Object.entries(currentSelection.select)) {
        let pathId = getPathId(k, v.args, variables);

        data[k] = Array.isArray(path[pathId]) ? [] : {};
        stack.unshift([k, v, path[pathId], data[k]]);
      }
    }
  }

  return { data, records, partial };
}
