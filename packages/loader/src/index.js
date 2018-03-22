import { isImportDefaultSpecifier, isIdentifier } from "babel-types";
import parseLiteral from "babel-literal-to-ast";

import compileQuery from "./compile-query";

const visitor = {
  Program(programPath, { opts }) {
    const tagNames = [];

    programPath.traverse({
      ImportDeclaration(path) {
        if (path.node.source.value === "@grafoo/loader") {
          const defaultSpecifier = path.node.specifiers.find(specifier =>
            isImportDefaultSpecifier(specifier)
          );

          if (!defaultSpecifier) {
            throw path.buildCodeFrameError("@grafoo/loader is a default import!");
          }

          const importToken = defaultSpecifier.local.name;

          if (importToken !== "gql" && importToken !== "graphql") {
            throw path.buildCodeFrameError(
              "@grafoo/loader should be imported as `gql` or `graphql`, instead got: `" +
                importToken +
                "`!"
            );
          }

          tagNames.push(importToken);

          path.remove();
        }
      },
      TaggedTemplateExpression(path) {
        if (tagNames.some(name => isIdentifier(path.node.tag, { name }))) {
          try {
            if (path.get("quasi").get("expressions").length) {
              throw path.buildCodeFrameError(
                "@grafoo/loader does not support interpolation in a graphql template string!"
              );
            }

            const source = path
              .get("quasi")
              .node.quasis.reduce((head, quasi) => head + quasi.value.raw, "");

            path.replaceWith(parseLiteral(compileQuery(source, opts)));
          } catch (error) {
            throw error;
          }
        }
      }
    });
  }
};

export default function transform() {
  return { visitor };
}
