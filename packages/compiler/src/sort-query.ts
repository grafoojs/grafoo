import { ASTNode, visit } from "graphql";

function sort(array: readonly ASTNode[], fn?: (f: any) => string) {
  fn = fn || ((obj) => obj.name.value);

  return (
    array &&
    array.slice().sort((prev, next) => {
      let a = fn(prev);
      let b = fn(next);
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    })
  );
}

export default function sortQuery(document: ASTNode): ASTNode {
  return visit(document, {
    Document(node) {
      return {
        ...node,
        definitions: [
          ...sort(node.definitions.filter((def) => def.kind === "FragmentDefinition")),
          ...node.definitions.filter((def) => def.kind !== "FragmentDefinition")
        ]
      };
    },
    OperationDefinition(node) {
      return {
        ...node,
        directives: sort(node.directives),
        variableDefinitions: sort(node.variableDefinitions, (_) => _.variable.name.value)
      };
    },
    SelectionSet(node) {
      return {
        ...node,
        selections: sort(node.selections, (_) => (_.alias || _.name || _.typeCondition.name).value)
      };
    },
    Field(node) {
      return {
        ...node,
        directives: sort(node.directives),
        arguments: sort(node.arguments)
      };
    },
    InlineFragment(node) {
      return {
        ...node,
        directives: sort(node.directives)
      };
    },
    FragmentSpread(node) {
      return {
        ...node,
        directives: sort(node.directives)
      };
    },
    FragmentDefinition(node) {
      return {
        ...node,
        directives: sort(node.directives)
      };
    },
    Directive(node) {
      return {
        ...node,
        arguments: sort(node.arguments)
      };
    }
  });
}
