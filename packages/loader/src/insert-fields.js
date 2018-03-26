import { buildASTSchema, parse, TypeInfo, visit, visitWithTypeInfo } from "graphql";

function getType(typeInfo) {
  let currentType = typeInfo.getType();
  while (currentType.ofType) currentType = currentType.ofType;
  return currentType;
}

export default function insertFields(schemaStr, documentAst, fieldsToInsert) {
  const typeInfo = new TypeInfo(buildASTSchema(parse(schemaStr)));

  const visitor = {
    SelectionSet({ selections }) {
      const type = getType(typeInfo);
      const fields = Object.keys(type.getFields());

      for (const field of fieldsToInsert) {
        if (
          field === "__typename" &&
          type.name !== "Query" &&
          !(type.getInterfaces && type.getInterfaces.length)
        ) {
          selections.push({ kind: "Field", name: { kind: "Name", value: field } });
        }

        const fieldIsNotDeclared = selections.some(_ => _.name.value !== field);
        const typeHasField = fields.some(_ => _ === field);

        if (fieldIsNotDeclared && typeHasField) {
          selections.push({ kind: "Field", name: { kind: "Name", value: field } });
        }
      }
    }
  };

  return visit(documentAst, visitWithTypeInfo(typeInfo, visitor));
}
