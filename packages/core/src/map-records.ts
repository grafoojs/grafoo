import { GrafooRecords } from ".";
import { isNotNullObject, idFromBranch } from "./util";

export default function mapRecords<T>(tree: T, idFields: string[]): GrafooRecords {
  // map in which records will be stored
  // having their extracted ids from props as key
  let map = {};
  let stack = [];

  // populates the stack with the tree branches
  for (let i in tree) stack.push(tree[i]);

  // will run until the stack is empty
  while (stack.length) {
    // pops the current branch from the stack
    let branch = stack.pop();
    // next node to be traversed. nested branches will be removed
    let filteredBranch = {};

    // iterate over branch properties
    // if the property is a branch it will be added to the stack
    // else if it is not a branch it will be added to filtered branch
    for (let i in branch) {
      let branchVal = branch[i];
      (isNotNullObject(branchVal) && stack.push(branchVal)) || (filteredBranch[i] = branchVal);
    }

    // node identifier
    let identifier = idFromBranch(branch, idFields);

    // if branch is a node, assign the value of filtered branch to it
    if (identifier) map[identifier] = Object.assign({}, map[identifier], filteredBranch);
  }

  return map;
}
