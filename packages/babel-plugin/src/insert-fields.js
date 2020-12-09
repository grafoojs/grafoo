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

      for (let field of idFields) {
        if (selections.some((_) => _.name && _.name.value === field)) {
          continue; // Skip already declared fields
        }

        let typeHasField = typeFields.some((_) => _ === field);
        let typeInterfacesHasField = typeInterfacesFields.some((_) => _ === field);

        if (
          typeHasField ||
          (field === "__typename" && !isFragment) ||
          (typeInterfacesHasField && !isFragment)
        ) {
          insertField(selections, field);
        }
      }

      isFragment = false;
    },
  };

  return visit(documentAst, visitWithTypeInfo(typeInfo, visitor));
}
