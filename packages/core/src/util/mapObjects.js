import { isNotNullObject, assign } from ".";

export default function mapObjects(tree) {
  // dictionary in which objects will be stored having their ids as key
  var dict = {},
    stack = [],
    i;

  // populates the stack with the tree branches
  for (i in tree) stack.push(tree[i]);

  // will run until the stack is empty
  while (stack.length) {
    // pops the current branch from the stack
    var branch = stack.pop(),
      // probable node id
      { id } = branch,
      // next node to be traversed. nested branches will be removed
      filteredBranch = {};

    // iterate over branch properties
    // if the property is a branch it will be added to the stack
    // else if it is not a branch it will be added to filtered branch
    for (i in branch)
      (isNotNullObject(branch[i]) && stack.push(branch[i])) || (filteredBranch[i] = branch[i]);

    // if branch is a node assign the value of filtered branch to it
    if (id) dict[id] = assign({}, dict[id], filteredBranch);
  }

  return dict;
}
