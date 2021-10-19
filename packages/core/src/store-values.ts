import { GrafooQuery, GrafooRecords, GrafooSelection, GrafooShape } from ".";
import { idFromBranch, getPathId, resolveSelection } from "./util";

export default function storeValues<T>(
  tree: T,
  { selections, fragments }: GrafooQuery,
  idFields: string[],
  variables?: Record<string, unknown>
) {
  let path: GrafooShape = {};
  let records: GrafooRecords = {};
  let stack: [string, T, GrafooSelection, GrafooShape][] = [["", tree, selections, path]];

  while (stack.length) {
    let [name, branch, select, path] = stack.shift();
    let isListItem = isNaN(name as any);
    let currentSelection = resolveSelection(isListItem ? select.select[name] : select, fragments);
    let pathId = isListItem ? getPathId(name, currentSelection.args, variables) : name;

    if (Array.isArray(branch)) {
      path[pathId] = [];
    } else {
      let id = idFromBranch(branch, idFields);

      if (id) {
        records[id] = records[id] || {};

        for (let field of currentSelection.scalars) {
          records[id][field] = branch[field];
        }

        path[pathId] = { id };
      }
    }

    for (let [k, v] of Object.entries(branch)) {
      if (typeof v === "object") {
        stack.unshift([k, v, currentSelection, path[pathId] || path]);
      }
    }
  }

  return { path, records };
}
