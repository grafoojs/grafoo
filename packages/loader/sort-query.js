const { visit } = require("graphql");

const sort = (arr, fn) =>
  arr.sort((prev, next) => {
    if (fn(prev) < fn(next)) return -1;
    if (fn(prev) > fn(next)) return 1;
    return 0;
  });

const visitor = {
  OperationDefinition(node) {
    sort(node.variableDefinitions, _ => _.variable.name.value);
    return node;
  },
  SelectionSet(node) {
    sort(node.selections, _ => _.name.value);
    return node;
  },
  Field(node) {
    if (node.arguments) sort(node.arguments, _ => _.name.value);
    return node;
  }
};

module.exports = function sortQuery(document) {
  const documentClone = JSON.parse(JSON.stringify(document));

  visit(documentClone, visitor);

  return documentClone;
};
