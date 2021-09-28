import { TypeInfo, buildASTSchema, parse, visit, visitWithTypeInfo } from "graphql";

function getType(typeInfo) {
  let currentType = typeInfo.getType();
  while (currentType.ofType) currentType = currentType.ofType;
  return currentType;
}

function insertField(selections, value) {
  selections.push({ kind: "Field", name: { kind: "Name", value } });
}

export default function insertFields(schemaStr, documentAst, idFields) {
  let typeInfo = new TypeInfo(buildASTSchema(parse(schemaStr)));

  let isOperationDefinition = false;
  let isFragment = false;

  let visitor = {
    OperationDefinition() {
      isOperationDefinition = true;
    },
    InlineFragment() {
      isFragment = true;
    },
    FragmentDefinition() {
      isFragment = true;
    },
    SelectionSet({ selections }) {
      if (isOperationDefinition) {
        isOperationDefinition = false;

        return;
      }

      let type = getType(typeInfo);

      if (type.astNode.kind === "UnionTypeDefinition") {
        return;
      }

      let typeFields = Object.keys(type.getFields());
      let typeInterfaces = type.getInterfaces ? type.getInterfaces() : [];
      let typeInterfacesFields = typeInterfaces.reduce(
        (acc, next) => acc.concat(Object.keys(next.getFields())),
        []
      );

      for (let id of idFields) {
        if (selections.some((s) => s.name && s.name.value === id)) {
          continue; // Skip already declared fields
        }

        let typeHasId = typeFields.some((s) => s === id);
        let typeInterfacesHasId = typeInterfacesFields.some((s) => s === id);

        if (
          typeHasId ||
          (id === "__typename" && !isFragment) ||
          (typeInterfacesHasId && !isFragment)
        ) {
          insertField(selections, id);
        }
      }

      isFragment = false;
    }
  };

  return visit(documentAst, visitWithTypeInfo(typeInfo, visitor));
}
