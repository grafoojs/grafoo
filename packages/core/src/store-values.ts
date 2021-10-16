import { GrafooQuery, GrafooRecords, GrafooSelection, GrafooShape } from ".";
import { idFromBranch, isNotNullObject, getPathId } from "./util";

export default function storeValues(
  tree: unknown,
  idFields: string[],
  { selections, fragments }: GrafooQuery,
  variables?: Record<string, unknown>
) {
  let shape = {} as GrafooShape;
  let stack = [] as [string, unknown, GrafooSelection, GrafooShape][];
  let records = {} as GrafooRecords;

  for (let [k, v] of Object.entries(tree)) {
    stack.push([k, v, selections, shape]);
  }

  while (stack.length) {
    let [path, branch, selection, shape] = stack.shift();

    if (isNotNullObject(branch)) {
      let isBrachList = Array.isArray(branch);
      let currentSelection = isNaN(path as any) ? selection.select[path] : selection;
      let queryPath = isNaN(path as any) ? path : getPathId(path, currentSelection.args, variables);

      if (currentSelection.fragments) {
        for (let f of currentSelection.fragments) {
          let fragment = fragments.select[f];

          currentSelection = {
            scalars: currentSelection.scalars?.concat(fragment.scalars),
            args: currentSelection.args?.concat(fragment.args),
            select: Object.assign({}, currentSelection.select, fragment.select),
            fragments: fragment.fragments
          };
        }
      }

      if (isBrachList) {
        shape[queryPath] = [];
      } else {
        let id = idFromBranch(branch, idFields);

        records[id] = records[id] || {};
        for (let field of currentSelection.scalars || []) {
          records[id][field] = branch[field];
        }

        shape[queryPath] = { id };
      }

      for (let [k, v] of Object.entries(branch)) {
        stack.unshift([k, v, currentSelection, shape[path]]);
      }
    }
  }

  return { shape, records };
}
