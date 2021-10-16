import { GrafooSelection } from "@grafoo/core";
import {
  ASTNode,
  FieldNode,
  FragmentDefinitionNode,
  GraphQLNonNull,
  GraphQLScalarType,
  GraphQLSchema,
  TypeInfo,
  visit,
  visitWithTypeInfo
} from "graphql";

let getNonNullType = (typeInfo: TypeInfo) => {
  let currentType = typeInfo.getType();
  if (currentType instanceof GraphQLNonNull) currentType = currentType.ofType;
  return currentType;
};

let findPath = (clientResolver: GrafooSelection, currentFields: string[]) => {
  let selection = clientResolver;
  for (let field of currentFields) selection = selection.select[field];
  return selection;
};

export default function generateClientResolver(schema: GraphQLSchema, document: ASTNode) {
  let t = new TypeInfo(schema);
  let clientResolver = { select: {} } as GrafooSelection;
  let currentFields = [];

  let incrementClientResolver = (node: FieldNode | FragmentDefinitionNode) => {
    let selection = findPath(clientResolver, currentFields);
    if (!(getNonNullType(t) instanceof GraphQLScalarType)) {
      let newSelection: GrafooSelection = {};
      let args = (node as FieldNode).arguments?.map((a) => a.name.value) ?? [];
      if (args.length) newSelection.args = args;

      selection.select = selection.select ?? {};
      selection.select[node.name.value] = newSelection;

      currentFields.push(node.name.value);
    } else {
      selection.scalars = selection.scalars ?? [];
      selection.scalars.push(node.name.value);
    }
  };

  visit(
    document,
    visitWithTypeInfo(t, {
      enter: {
        Field(node) {
          incrementClientResolver(node);
        },
        FragmentDefinition(node) {
          incrementClientResolver(node);
        },
        FragmentSpread(node) {
          let selection = findPath(clientResolver, currentFields);
          selection.fragments = selection.fragments ?? [];
          selection.fragments.push(node.name.value);
        }
      },
      leave: {
        Field() {
          if (!(getNonNullType(t) instanceof GraphQLScalarType)) currentFields.pop();
        },
        FragmentDefinition() {
          if (!(getNonNullType(t) instanceof GraphQLScalarType)) currentFields.pop();
        }
      }
    })
  );

  return clientResolver;
}
