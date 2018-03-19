import { isNotNullObject, assign } from ".";

export default function mapObjects(tree) {
  // dictionary in which objects will be stored having their ids as key
  const dict = {};
  const stack = [];

  // populates the stack with the tree branches
  for (const i in tree) stack.push(tree[i]);

  // will run until the stack is empty
  while (stack.length) {
    // pops the current branch from the stack
    const branch = stack.pop();
    // probable node id
    const { id } = branch;
    // next node to be traversed. nested branches will be removed
    const filteredBranch = {};

    // iterate over branch properties
    // if the property is a branch it will be added to the stack
    // else if it is not a branch it will be added to filtered branch
    for (const i in branch)
      (isNotNullObject(branch[i]) && stack.push(branch[i])) || (filteredBranch[i] = branch[i]);

    // if branch is a node assign the value of filtered branch to it
    if (id) dict[id] = assign({}, dict[id], filteredBranch);
  }

  return dict;
}
