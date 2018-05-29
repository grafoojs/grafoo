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
  const typeInfo = new TypeInfo(buildASTSchema(parse(schemaStr)));

  let isOperationDefinition = false;
  let isFragment = false;

  const visitor = {
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

      const type = getType(typeInfo);
      const typeFields = Object.keys(type.getFields());
      const typeInterfaces = type.getInterfaces ? type.getInterfaces() : [];
      const typeInterfacesFields = typeInterfaces.reduce(
        (acc, next) => acc.concat(Object.keys(next.getFields())),
        []
      );

      for (const field of idFields) {
        const fieldIsNotDeclared = selections.some(_ => _.name.value !== field);
        const fieldIsTypename = field === "__typename";
        const typeHasField = typeFields.some(_ => _ === field);
        const typeInterfacesHasField = typeInterfacesFields.some(_ => _ === field);

        if (fieldIsTypename && fieldIsNotDeclared && !isFragment) {
          insertField(selections, field);
        }

        if (fieldIsNotDeclared && typeInterfacesHasField && !isFragment) {
          insertField(selections, field);
        }

        if (fieldIsNotDeclared && typeHasField) {
          insertField(selections, field);
        }
      }

      isFragment = false;
    }
  };

  return visit(documentAst, visitWithTypeInfo(typeInfo, visitor));
}
