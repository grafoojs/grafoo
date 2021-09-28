import { ObjectsMap } from "@grafoo/types";
import { idFromProps, isNotNullObject } from "./util";

export default function buildQueryTree<T>(tree: T, objects: ObjectsMap, idFields: string[]): T {
  // clone resulting query tree
  let queryTree = tree;
  let stack = [];

  // populates stack with the properties of the query tree and the query tree it self
  for (let i in queryTree) stack.push([i, queryTree]);

  // will loop until the stack is empty
  while (stack.length) {
    // pops a stack entry extracting the current key of the tree's branch
    // (eg: a node or an edge) and the branch it self
    let [key, currentTree] = stack.pop();
    // assigns nested branch
    let branch = currentTree[key];
    // get node identifier
    let identifier = idFromProps(branch, idFields);
    // possible node matching object
    let branchObject = objects[identifier];

    // iterates over the child branch properties
    for (let i in Object.assign({}, branch, branchObject)) {
      // assigns to the child branch all properties retrieved
      // from the corresponding object retrieved from the objects cache
      if (identifier && branchObject) branch[i] = branchObject[i] || branch[i];

      // pushes properties of the child branch and the branch it self to the stack
      if (isNotNullObject(branch[i])) stack.push([i, branch]);
    }
  }

  return queryTree;
}
