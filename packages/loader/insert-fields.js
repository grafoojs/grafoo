const { parse, buildASTSchema } = require("graphql");

function getType(type) {
  let currentType = type;
  while (currentType.ofType) currentType = currentType.ofType;
  return currentType;
}

function capitalize(str) {
  const [first, ...rest] = str;
  return [first.toUpperCase(), ...rest].join("");
}

module.exports = function insertFields(schemaStr, documentAst, fieldsToInsert) {
  const parsedSchema = buildASTSchema(parse(schemaStr));
  const documentAstClone = JSON.parse(JSON.stringify(documentAst));

  for (const { selectionSet: { selections }, operation } of documentAstClone.definitions) {
    const type = parsedSchema.getType(capitalize(operation));
    const stack = [];

    for (const selection of selections) {
      stack.push([selection, getType(type.getFields()[selection.name.value].type).getFields()]);
    }

    while (stack.length) {
      const [currentSelection, currentType] = stack.pop();

      if (currentType) {
        const nextSelections = currentSelection.selectionSet.selections;

        for (const nextSelection of nextSelections) {
          stack.push([nextSelection, getType(currentType[nextSelection.name.value].type)._fields]);
        }

        for (const field of fieldsToInsert) {
          const isFieldDeclared = currentSelection.selectionSet.selections.some(
            s => s.name.value === field
          );

          if ((!isFieldDeclared && !!currentType[field]) || field === "__typename") {
            currentSelection.selectionSet.selections.push({
              kind: "Field",
              name: {
                kind: "Name",
                value: field
              }
            });
          }
        }
      }
    }
  }

  return documentAstClone;
};
