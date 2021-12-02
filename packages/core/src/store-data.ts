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
  let stack: [string, any, GrafooSelection, GrafooPath][] = Object.entries(data).map((e) => [
    ...e,
    operation,
    paths
  ]);

  // traverse data tree
  while (stack.length) {
    let [name, branch, select, path] = stack.shift();
    let isArrayChild = isNaN(parseInt(name));
    let currentSelect = resolveSelection(isArrayChild ? select.select[name] : select, fragments);
    let pathId = isArrayChild ? getPathId(name, currentSelect.args, variables) : name;

    // skip if a branch is null or undefined
    if (!branch) {
      path[pathId] = branch;
      continue;
    }

    if (Array.isArray(branch)) {
      path[pathId] = [];
    } else {
      let id = idFromBranch(branch, idFields);

      path[pathId] = { ...(id && { id }) };

      for (let field of currentSelect.scalars) {
        if (id) {
          // create a record
          records[id] = records[id] ?? {};
          // populate record with branch scalar values
          records[id][field] = branch[field];
        } else {
          // add scalars to the path object if the node doesn't have id fields
          path[pathId][field] = branch[field];
        }
      }
    }

    // look for new branches and increment stack
    for (let [k, v] of Object.entries(branch)) {
      if (typeof v === "object") stack.unshift([k, v, currentSelect, path[pathId]]);
    }
  }

  return { paths, records };
}
