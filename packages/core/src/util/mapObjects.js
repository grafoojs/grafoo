import { isNotNullObject, assign } from ".";

export default function mapObjects(tree, idFromProps) {
  // map in which objects will be stored
  // having their extracted ids from props as key
  const map = {};
  const stack = [];

  // populates the stack with the tree branches
  for (let i in tree) stack.push(tree[i]);

  // will run until the stack is empty
  while (stack.length) {
    // pops the current branch from the stack
    const branch = stack.pop();
    // next node to be traversed. nested branches will be removed
    const filteredBranch = {};

    // iterate over branch properties
    // if the property is a branch it will be added to the stack
    // else if it is not a branch it will be added to filtered branch
    for (let i in branch)
      (isNotNullObject(branch[i]) && stack.push(branch[i])) || (filteredBranch[i] = branch[i]);

    // get node identifier
    const identifier = idFromProps(branch);
    // if branch is a node assign the value of filtered branch to it
    if (identifier) map[identifier] = assign({}, map[identifier], filteredBranch);
  }

  return map;
}
