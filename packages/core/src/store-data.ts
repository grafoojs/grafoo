import { GrafooPath, GrafooQuery, GrafooRecords, GrafooSelection } from "./types";
import { idFromBranch, getPathId, resolveSelection } from "./util";

export default function storeData<T extends GrafooQuery>(
  { operation, fragments }: T,
  variables: T["_variablesType"],
  data: T["_queryType"],
  idFields: string[]
) {
  let records: GrafooRecords = {};
  let paths: GrafooPath = {};
  let stack: [string | void, T["_queryType"], GrafooSelection, GrafooPath][] = [
    [undefined, data, operation, paths]
  ];

  // traverse data tree
  while (stack.length) {
    let [name, branch, select, path] = stack.shift();

    // on the first iteration name is not defined
    if (typeof name === "undefined") {
      // add scalars to the path object if the node doesn't have id fields
      for (let field of select.scalars ?? []) path[field] = branch[field];

      for (let [k, v] of Object.entries(branch)) {
        if (typeof v === "object") stack.unshift([k, v, select, path]);
      }
    } else {
      let isListItem = isNaN(parseInt(name));
      let currentSelect = resolveSelection(isListItem ? select.select[name] : select, fragments);
      let pathId = isListItem ? getPathId(name, currentSelect.args, variables) : name;

      // skip if a branch is null or undefined
      if (!branch) {
        path[pathId] = branch;
        continue;
      }

      if (Array.isArray(branch)) {
        path[pathId] = [...(path[pathId] ?? [])];
      } else {
        let id = idFromBranch(branch, idFields);

        path[pathId] = { ...path[pathId] };

        if (id) {
          // increment path with id pointing to a record
          path[pathId].id = id;
          records[id] = records[id] ?? {};

          // populate record with branch scalar values
          for (let field of currentSelect.scalars) records[id][field] = branch[field];
        } else {
          // add scalars to the path object if the node doesn't have id fields
          for (let field of currentSelect.scalars) path[pathId][field] = branch[field];
        }
      }

      // look for new branches and increment stack
      for (let [k, v] of Object.entries(branch)) {
        if (typeof v === "object") stack.unshift([k, v, currentSelect, path[pathId]]);
      }
    }
  }

  return { paths, records };
}
