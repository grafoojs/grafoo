import { GrafooPath, GrafooQuery, GrafooRecords, GrafooSelection } from "./types";
import { getPathId, getPathType, resolveSelection } from "./util";

export default function resolveData<T extends GrafooQuery>(
  { operation, fragments }: T,
  variables: T["_variablesType"],
  allPaths: GrafooPath,
  allRecords: GrafooRecords
) {
  let data = {} as T["_queryType"];
  let partial = false;
  let stack: [GrafooSelection, GrafooPath<{ id?: string }>, any][] = [[operation, allPaths, data]];

  // traverse operation selection
  while (stack.length) {
    let [select, path, data] = stack.shift();

    if (Array.isArray(path)) {
      // if path is an array increment the stack with
      // the current selection and path children
      for (let [index, item] of Object.entries(path)) {
        // assign path type to data key
        data[index] = getPathType(item);
        stack.unshift([select, item, data[index]]);
      }
    } else {
      let currentSelect = resolveSelection(select, fragments);
      let record = allRecords[path.id];

      for (let s of currentSelect.scalars) data[s] = record?.[s] ?? path?.[s];

      for (let [name, value] of Object.entries(currentSelect.select)) {
        let pathId = getPathId(name, value.args, variables);
        let newPath = path[pathId];

        // skip selection if path is undefined
        if (newPath === undefined) {
          partial = true;
        } else {
          // assign path type to data key
          data[name] = getPathType(newPath);
          if (newPath) stack.unshift([value, newPath, data[name]]);
        }
      }
    }
  }

  return { data, partial };
}
