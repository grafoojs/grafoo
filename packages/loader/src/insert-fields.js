import { buildASTSchema, parse, TypeInfo, visit, visitWithTypeInfo } from "graphql";

function getType(typeInfo) {
  let currentType = typeInfo.getType();
  while (currentType.ofType) currentType = currentType.ofType;
  return currentType;
}

function insertField(selections, value) {
  selections.push({ kind: "Field", name: { kind: "Name", value } });
}

export default function insertFields(schemaStr, documentAst, fieldsToInsert) {
  const typeInfo = new TypeInfo(buildASTSchema(parse(schemaStr)));

  const visitor = {
    SelectionSet({ selections }) {
      const type = getType(typeInfo);
      const typeFields = Object.keys(type.getFields());

      for (const field of fieldsToInsert) {
        const fieldIsNotDeclared = selections.some(_ => _.name.value !== field);
        const fieldIsTypename = field === "__typename";
        const typeDoesNotImplementInterface = !(type.getInterfaces && type.getInterfaces().length);
        const typeHasField = typeFields.some(_ => _ === field);
        const typeIsNotQuery = type.name !== "Query";

        if (
          fieldIsTypename &&
          fieldIsNotDeclared &&
          typeIsNotQuery &&
          typeDoesNotImplementInterface
        ) {
          insertField(selections, field);
        }

        if (fieldIsNotDeclared && typeHasField) {
          insertField(selections, field);
        }
      }
    }
  };

  return visit(documentAst, visitWithTypeInfo(typeInfo, visitor));
}
