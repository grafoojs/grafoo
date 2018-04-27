import { visit } from "graphql";
import { sortAlphabetically as sort } from "@grafoo/util";

const visitor = {
  OperationDefinition(node) {
    sort(node.directives);
    sort(node.variableDefinitions, _ => _.variable.name.value);
  },
  SelectionSet(node) {
    sort(node.selections, _ => (_.alias || _.name).value);
  },
  Field(node) {
    sort(node.directives);
    sort(node.arguments);
  },
  InlineFragment(node) {
    sort(node.directives);
  },
  FragmentSpread(node) {
    sort(node.directives);
  },
  FragmentDefinition(node) {
    sort(node.directives);
    sort(node.variableDefinitions, _ => _.variable.name.value);
  },
  Directive(node) {
    sort(node.arguments);
  }
};

export default function sortQuery(document) {
  return visit(document, visitor);
}
