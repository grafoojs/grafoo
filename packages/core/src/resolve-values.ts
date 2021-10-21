import { GrafooPath, GrafooQuery, GrafooRecords, GrafooSelection } from "./types";
import { getPathId, getPathType, resolveSelection } from "./util";

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

  // traverse trough operation selection
  while (stack.length) {
    let [name, select, path, data] = stack.shift();

    if (Array.isArray(path)) {
      // if path is a list increment the stack with
      // the current selection and the path list children
      for (let [k, v] of Object.entries(path)) {
        // assign data type to data key given the path type
        data[k] = getPathType(v);
        stack.unshift([name, select, v, data[k]]);
      }
    } else {
      let currentSelect = resolveSelection(select, fragments);
      let { id } = path;
      let record = allRecords[id];

      if (id) {
        records[id] = record;

        // get scalars from client records
        for (let s of currentSelect.scalars) {
          data[s] = record[s];
        }
      }

      for (let [k, v] of Object.entries(currentSelect.select)) {
        let pathId = getPathId(k, v.args, variables);
        let newPath = path[pathId];

        // skip selection if path is undefined
        if (newPath === undefined) {
          partial = true;
        } else {
          // assign data type to data key given the path type
          data[k] = getPathType(newPath);
          if (newPath) stack.unshift([k, v, newPath, data[k]]);
        }
      }
    }
  }

  return { data, records, partial };
}
