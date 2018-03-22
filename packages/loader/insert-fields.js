const { parse, visit } = require("graphql");

function getTypeName(type) {
  let currentType = type;
  while (currentType.type) currentType = currentType.type;
  return currentType.name.value;
}

function capitalize(str) {
  const [first, ...rest] = str;
  return [first.toUpperCase(), ...rest].join("");
}

function getDefinition(ast, name) {
  return (ast.definitions || ast.fields).find(field => field.name.value === name);
}

module.exports = function insertFields(schemaStr, documentAst, fieldsToInsert) {
  const parsedSchema = parse(schemaStr);
  const types = [];

  const visitor = {
    OperationDefinition({ operation }) {
      types.push(getDefinition(parsedSchema, capitalize(operation)));
    },
    FragmentDefinition({ typeCondition }) {
      types.push(getDefinition(parsedSchema, typeCondition.name.value));
    },
    InlineFragment({ typeCondition }) {
      types.push(getDefinition(parsedSchema, typeCondition.name.value));
    },
    Field: {
      enter(node) {
        const { selectionSet, name } = node;

        if (!selectionSet) return;

        types.push(
          getDefinition(
            parsedSchema,
            getTypeName(getDefinition(types[types.length - 1], name.value))
          )
        );

        const currentType = types[types.length - 1];

        for (const field of fieldsToInsert) {
          const fieldIsNotDeclared = selectionSet.selections.some(s => s.name.value !== field);
          const typeHasField = currentType.fields.some(f => f.name.value === field);

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

        return node;
      },
      leave(node) {
        if (node.selectionSet) types.pop();
      }
    }
  };

  return visit(documentAst, visitor);
};
