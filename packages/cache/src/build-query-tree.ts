import { idFromProps, isNotNullObject } from "./util";

export default function buildQueryTree(tree, objects, idFields) {
  // clone resulting query tree
  const queryTree = JSON.parse(JSON.stringify(tree));
  const stack = [];

  // populates stack with the properties of the query tree and the query tree it self
  for (const i in queryTree) stack.push([i, queryTree]);

  // will loop until the stack is empty
  while (stack.length) {
    // pops a stack entry extracting the current key of the tree's branch
    // (eg: a node or an edge) and the branch it self
    const [key, currentTree] = stack.pop();
    // assigns nested branch
    const branch = currentTree[key];
    // get node identifier
    const identifier = idFromProps(branch, idFields);
    // possible node matching object
    const branchObject = objects[identifier];

    // iterates over the child branch properties
    for (const i in Object.assign({}, branch, branchObject)) {
      // assigns to the child branch all properties retrieved
      // from the corresponding object retrieved from the objects cache
      if (identifier && branchObject) branch[i] = branchObject[i] || branch[i];

      // pushes properties of the child branch and the branch it self to the stack
      if (isNotNullObject(branch[i])) stack.push([i, branch]);
    }
  }

  return queryTree;
}
