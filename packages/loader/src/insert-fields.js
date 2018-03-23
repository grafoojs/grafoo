import { parse, visit } from "graphql";

function getTypeName(type) {
  let currentType = type;
  while (currentType.type) currentType = currentType.type;
  return currentType.name.value;
}

function getDefinition(ast, name) {
  return (ast.definitions || ast.fields).find(field => field.name.value === name);
}

function capitalize(str) {
  const [first, ...rest] = str;
  return [first.toUpperCase(), ...rest].join("");
}

export default function insertFields(schemaStr, documentAst, fieldsToInsert) {
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

        const currentType = getDefinition(
          parsedSchema,
          getTypeName(getDefinition(types[types.length - 1], name.value))
        );

        types.push(currentType);

        for (const field of fieldsToInsert) {
          if (selectionSet.selections.some(_ => !_.name)) continue;

          const fieldIsNotDeclared = selectionSet.selections.some(_ => _.name.value !== field);
          const typeHasField = currentType.fields.some(_ => _.name.value === field);

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
      },
      leave(node) {
        if (node.selectionSet) types.pop();
      }
    }
  };

  return visit(documentAst, visitor);
}
