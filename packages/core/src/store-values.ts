import { GrafooPath, GrafooQuery, GrafooRecords, GrafooSelection } from "./types";
import { idFromBranch, getPathId, resolveSelection } from "./util";

export default function storeValues<T extends GrafooQuery>(
  query: T,
  variables: T["_variablesType"],
  tree: T["_queryType"],
  idFields: string[]
) {
  let { operation, fragments } = query;
  let path: GrafooPath = {};
  let records: GrafooRecords = {};
  let stack: [string, T["_queryType"], GrafooSelection, GrafooPath][] = [
    ["", tree, operation, path]
  ];

  while (stack.length) {
    let [name, branch, select, path] = stack.shift();
    let isListItem = isNaN(name as any);
    let currentSelect = resolveSelection(isListItem ? select.select[name] : select, fragments);
    let pathId = isListItem ? getPathId(name, currentSelect.args, variables) : name;

    if (!branch) {
      path[pathId] = null;
      continue;
    }

    if (Array.isArray(branch)) {
      path[pathId] = [];
    }

    let id = idFromBranch(branch, idFields);

    if (id) {
      records[id] = records[id] || {};

      for (let field of currentSelect.scalars) {
        records[id][field] = branch[field];
      }

      path[pathId] = { id };
    }

    for (let [k, v] of Object.entries(branch)) {
      if (typeof v === "object") {
        stack.unshift([k, v, currentSelect, path[pathId] || path]);
      }
    }
  }

  return { path, records };
}
