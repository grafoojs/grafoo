import { buildASTSchema, parse, TypeInfo, visit, visitWithTypeInfo } from "graphql";

function getType(typeInfo) {
  let currentType = typeInfo.getType();
  while (currentType.ofType) currentType = currentType.ofType;
  return currentType;
}

export default function insertFields(schemaStr, documentAst, fieldsToInsert) {
  const typeInfo = new TypeInfo(buildASTSchema(parse(schemaStr)));

  const visitor = {
    Field({ selectionSet }) {
      if (!selectionSet) return;

      const type = getType(typeInfo);
      const fields = Object.keys(type.getFields());

      for (const field of fieldsToInsert) {
        const fieldIsNotDeclared = selectionSet.selections
          .filter(_ => _.kind !== "InlineFragment")
          .some(_ => _.name.value !== field);

        const typeHasField = fields.some(_ => _ === field);

        if ((fieldIsNotDeclared && typeHasField) || field === "__typename") {
          selectionSet.selections.push({
            kind: "Field",
            name: {
              kind: "Name",
              value: field
            }
          });
        }
      }
    }
  };

  return visit(documentAst, visitWithTypeInfo(typeInfo, visitor));
}
