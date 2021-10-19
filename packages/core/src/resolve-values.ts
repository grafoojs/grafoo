import { GrafooQuery, GrafooRecords, GrafooSelection, GrafooShape } from ".";
import { getPathId, resolveSelection } from "./util";

export default function resolveValues<T>(
  { selections, fragments }: GrafooQuery,
  shape: GrafooShape,
  records: GrafooRecords,
  variables?: Record<string, unknown>
) {
  let data = {} as T;
  let stack: [string, GrafooSelection, GrafooShape, T][] = [["", selections, shape, data]];

  while (stack.length) {
    let [name, select, path, data] = stack.shift();

    if (Array.isArray(path)) {
      for (let [k, v] of Object.entries(path)) {
        data[k] = Array.isArray(v) ? [] : {};
        stack.unshift([name, select, v, data[k]]);
      }
    } else {
      let currentSelection = resolveSelection(select, fragments);

      for (let s of currentSelection.scalars) {
        data[s] = records[path.id as string][s];
      }

      for (let [k, v] of Object.entries(currentSelection.select)) {
        let pathId = getPathId(k, v.args, variables);
        data[k] = Array.isArray(path[pathId]) ? [] : {};
        stack.unshift([k, v, path[pathId], data[k]]);
      }
    }
  }

  return data;
}
