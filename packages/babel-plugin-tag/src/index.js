import { isImportDefaultSpecifier, isIdentifier } from "babel-types";
import parseLiteral from "babel-literal-to-ast";

import compileDocument from "./compile-document";

const visitor = {
  Program(programPath, { opts }) {
    const tagNames = [];

    if (!opts.schema) {
      throw programPath.buildCodeFrameError("@grafoo/babel-plugin-tag needs a schema!");
    }

    if (!opts.fieldsToInsert) {
      opts.fieldsToInsert = [];
    }

    programPath.traverse({
      ImportDeclaration(path) {
        if (path.node.source.value === "@grafoo/core/tag") {
          const defaultSpecifier = path.node.specifiers.find(specifier =>
            isImportDefaultSpecifier(specifier)
          );

          if (!defaultSpecifier) {
            throw path.buildCodeFrameError("@grafoo/core/tag is a default import!");
          }

          tagNames.push(defaultSpecifier.local.name);

          path.remove();
        }
      },
      TaggedTemplateExpression(path) {
        if (tagNames.some(name => isIdentifier(path.node.tag, { name }))) {
          try {
            if (path.get("quasi").get("expressions").length) {
              throw path.buildCodeFrameError(
                "@grafoo/babel-plugin-tag does not support" +
                  " interpolation in a graphql template string!"
              );
            }

            const source = path
              .get("quasi")
              .node.quasis.reduce((head, quasi) => head + quasi.value.raw, "");

            try {
              const compiled = compileDocument(source, opts);

              path.replaceWith(parseLiteral(compiled));
            } catch (err) {
              if (err.code === "ENOENT") throw err;

              throw path.buildCodeFrameError(err.message);
            }
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
