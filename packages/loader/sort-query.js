const sort = (arr, fn) =>
  arr.sort((prev, next) => {
    if (fn(prev) < fn(next)) return -1;
    if (fn(prev) > fn(next)) return 1;
    return 0;
  });

module.exports = function sortQuery(ast) {
  const astClone = JSON.parse(JSON.stringify(ast));
  const [query] = astClone.definitions;

  query.selectionSet.selections = sort(query.selectionSet.selections, _ => _.name.value);

  query.variableDefinitions = sort(query.variableDefinitions, _ => _.variable.name.value);

  const { selections } = query.selectionSet;

  const stack = [];

  let i;
  for (i in selections) stack.push(selections[i]);

  while (stack.length) {
    let currentSelection = stack.pop();

    if (currentSelection.arguments) {
      currentSelection.arguments = sort(currentSelection.arguments, _ => _.name.value);
    }

    if (currentSelection.selectionSet) {
      stack.push(...currentSelection.selectionSet.selections);

      currentSelection.selectionSet.selections = sort(
        currentSelection.selectionSet.selections,
        _ => _.name.value
      );
    }
  }

  return astClone;
};
