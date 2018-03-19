import { assign } from ".";

export default function mergeObjects(objects, newObjects) {
  const merged = assign({}, objects, newObjects);
  for (const id in objects) merged[id] = assign({}, objects[id], newObjects[id]);
  return merged;
}
