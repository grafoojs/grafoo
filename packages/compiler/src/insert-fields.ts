import {
  ASTKindToNode,
  DocumentNode,
  FieldNode,
  GraphQLSchema,
  GraphQLUnionType,
  TypeInfo,
  Visitor,
  visit,
  visitWithTypeInfo
} from "graphql";

function getType(typeInfo) {
  let currentType = typeInfo.getType();
  while (currentType?.ofType) currentType = currentType.ofType;
  return currentType;
}

export default function insertFields(
  schema: GraphQLSchema,
  documentAst: DocumentNode,
  idFields: string[]
): DocumentNode {
  let typeInfo = new TypeInfo(schema);
  let unionChildrenTypes = [];
  let isOperationDefinition = false;
  let isFragment = false;

  let visitor: Visitor<ASTKindToNode> = {
    OperationDefinition() {
      isOperationDefinition = true;
    },
    InlineFragment() {
      isFragment = true;
    },
    FragmentDefinition() {
      isFragment = true;
    },
    SelectionSet(node) {
      let { selections } = node;
      let newSelections = [];

      if (isOperationDefinition) {
        isOperationDefinition = false;
        return;
      }

      let t = getType(typeInfo);

      if (!t) return;

      if (t.astNode.kind === "UnionTypeDefinition") {
        unionChildrenTypes.push(
          ...(typeInfo.getType() as GraphQLUnionType).astNode.types.map((t) => t.name.value)
        );

        return;
      }

      let typeFields = Object.keys(t.getFields());
      let typeInterfaces = t.getInterfaces();
      let typeInterfacesFields = typeInterfaces.reduce(
        (acc, next) => acc.concat(Object.keys(next.getFields())),
        []
      );

      for (let id of idFields) {
        if ((selections as FieldNode[]).some((s) => s.name?.value === id)) {
          continue; // Skip already declared fields
        }

        let typeHasId = typeFields.some((s) => s === id);
        let typeInterfacesHasId = typeInterfacesFields.some((s) => s === id);

        if (
          typeHasId ||
          (id === "__typename" && !isFragment) ||
          (typeInterfacesHasId && !isFragment)
        ) {
          newSelections.push({ kind: "Field", name: { kind: "Name", value: id } });
        }
      }

      let result = { ...node, selections: [...selections, ...newSelections] };

      if (isFragment) {
        isFragment = false;

        if (unionChildrenTypes.includes(t.inspect())) return result;

        return;
      }

      return result;
    }
  };

  return visit(documentAst, visitWithTypeInfo(typeInfo, visitor));
}
