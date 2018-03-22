import { visit } from "graphql";

const sort = (array, fn = _ => _.name.value) =>
  array &&
  array.sort((prev, next) => {
    if (fn(prev) < fn(next)) return -1;
    if (fn(prev) > fn(next)) return 1;
    return 0;
  });

const visitor = {
  OperationDefinition(node) {
    sort(node.directives);
    sort(node.variableDefinitions, _ => _.variable.name.value);
    return node;
  },
  SelectionSet(node) {
    sort(node.selections, _ => (_.alias || _.name).value);
    return node;
  },
  Field(node) {
    sort(node.directives);
    sort(node.arguments);
    return node;
  },
  InlineFragment(node) {
    sort(node.directives);
    return node;
  },
  FragmentSpread(node) {
    sort(node.directives);
    return node;
  },
  FragmentDefinition(node) {
    sort(node.directives);
    sort(node.variableDefinitions, _ => _.variable.name.value);
    return node;
  },
  Directive(node) {
    sort(node.arguments);
    return node;
  }
};

export default function sortQuery(document) {
  return visit(document, visitor);
}
