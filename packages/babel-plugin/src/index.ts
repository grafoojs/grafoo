import type * as bc from "@babel/core";
import { parseExpression } from "@babel/parser";
import compileDocument from "@grafoo/compiler";

export default function transform({ types: t }: typeof bc): bc.PluginObj {
  return {
    visitor: {
      Program(program) {
        let tags = [];

        program.traverse({
          ImportSpecifier(path) {
            let parentPath = path.parentPath as bc.NodePath<bc.types.ImportDeclaration>;

            if (parentPath.node.source.value !== "@grafoo/core") return;

            let { name } = path.node.local;

            if (!["graphql", "gql"].some((n) => n === name)) return;

            tags.push(name);
            path.remove();

            if (!parentPath.node.specifiers.length) parentPath.remove();
          },
          TaggedTemplateExpression(path) {
            if (!tags.some((n) => t.isIdentifier(path.node.tag, { name: n }))) return;

            let quasi = path.get("quasi");
            let expressions = quasi.get("expressions");

            if (expressions.length) {
              throw expressions[0].buildCodeFrameError(
                "@grafoo/core: interpolation is not supported in a graphql tagged template literal."
              );
            }

            let source = quasi.node.quasis.reduce((q, s) => q + s.value.raw, "");
            let query = compileDocument(source);
            path.replaceWith(parseExpression(query));
          }
        });
      }
    }
  };
}
