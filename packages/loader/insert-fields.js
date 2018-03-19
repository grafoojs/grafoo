const { parse, buildASTSchema } = require("graphql");

function getType(type) {
  let currentType = type;
  while (currentType.ofType) currentType = currentType.ofType;
  return currentType;
}

module.exports = function insertFields(schema, queryAst, fields) {
  const parsedSchema = buildASTSchema(parse(schema));
  const queryAstClone = JSON.parse(JSON.stringify(queryAst));
  const [{ selectionSet: { selections }, operation }] = queryAstClone.definitions;
  const stack = [];

  for (const i in selections) {
    stack.push([
      selections[i],
      getType(parsedSchema[`_${operation}Type`]._fields[selections[i].name.value].type)._fields
    ]);
  }

  while (stack.length) {
    const [currentSelection, currentType] = stack.pop();

    if (currentType) {
      const nextSelections = currentSelection.selectionSet.selections;

      for (const i in nextSelections) {
        stack.push([
          nextSelections[i],
          getType(currentType[nextSelections[i].name.value].type)._fields
        ]);
      }

      for (const i in fields) {
        const isFieldDeclared = currentSelection.selectionSet.selections.some(
          s => s.name.value === fields[i]
        );

        if ((!isFieldDeclared && !!currentType[fields[i]]) || fields[i] === "__typename") {
          currentSelection.selectionSet.selections.push({
            kind: "Field",
            name: {
              kind: "Name",
              value: fields[i]
            }
          });
        }
      }
    }
  }

  return queryAstClone;
};
