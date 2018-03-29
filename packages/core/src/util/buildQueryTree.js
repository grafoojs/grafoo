import { isNotNullObject } from ".";

export default function buildQueryTree(tree, objects, idFromProps) {
  // clone resulting query tree
  var queryTree = JSON.parse(JSON.stringify(tree)),
    stack = [],
    i;

  // populates stack with the properties of the query tree and the query tree it self
  for (i in queryTree) stack.push([i, queryTree]);

  // will loop until the stack is empty
  while (stack.length) {
    // pops a stack entry extracting the current key of the tree's branch
    // (eg: a node or an edge) and the branch it self
    var [key, currentTree] = stack.pop(),
      // assigns nested branch
      branch = currentTree[key],
      // probable node id
      id = idFromProps(branch);

    // iterates over the child branch
    for (i in branch) {
      // assigns to the child branch all properties retrieved
      // from the corresponding object retrieved from the objects cache
      if (id) branch[i] = objects[id][i] || branch[i];

      // pushes properties of the child branch and the branch it self to the stack
      if (isNotNullObject(branch[i])) stack.push([i, branch]);
    }
  }

  return queryTree;
}
