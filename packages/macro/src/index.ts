import type bc from "@babel/core";
import { parseExpression } from "@babel/parser";
import { createMacro } from "babel-plugin-macros";
import compileDocument from "@grafoo/compiler";
import { graphql } from "@grafoo/core";

export default createMacro(({ references }) => {
  for (let ref of references.default) {
    let path = ref as bc.NodePath<bc.types.Identifier>;
    let targetPath = path.parentPath;

    if (targetPath.type === "TaggedTemplateExpression") {
      let quasi = ref.parentPath.get("quasi") as bc.NodePath<bc.types.TemplateLiteral>;

      let expressions = quasi.get("expressions");

      if (expressions.length) {
        throw expressions[0].buildCodeFrameError(
          "@grafoo/macro: interpolation is not supported in a graphql tagged template literal."
        );
      }

      let source = quasi.node.quasis.reduce((src, q) => src + q.value.raw, "");
      let query = compileDocument(source);
      targetPath.replaceWith(parseExpression(query));
    }
  }
}) as typeof graphql;
