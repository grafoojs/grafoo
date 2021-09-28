import { visit } from "graphql";

function sort(array, fn) {
  fn = fn || ((obj) => obj.name.value);

  return (
    array &&
    array.sort((prev, next) => {
      let a = fn(prev);
      let b = fn(next);
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    })
  );
}

export default function sortQuery(document) {
  return visit(document, {
    Document(node) {
      node.definitions = [
        ...sort(node.definitions.filter((def) => def.kind === "FragmentDefinition")),
        ...node.definitions.filter((def) => def.kind !== "FragmentDefinition")
      ];
    },
    OperationDefinition(node) {
      sort(node.directives);
      sort(node.variableDefinitions, (_) => _.variable.name.value);
    },
    SelectionSet(node) {
      sort(node.selections, (_) => (_.alias || _.name || _.typeCondition.name).value);
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
    },
    Directive(node) {
      sort(node.arguments);
    }
  });
}
