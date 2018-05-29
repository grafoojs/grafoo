import parseLiteral from "babel-literal-to-ast";
import { isIdentifier, isImportDefaultSpecifier } from "babel-types";
import compileDocument from "./compile-document";

const visitor = {
  Program(programPath, { opts }) {
    const tagNames = [];

    if (!opts.schema) {
      throw new Error("@grafoo/babel-plugin-tag: no schema was specified.");
    }

    if (!opts.fieldsToInsert) {
      opts.fieldsToInsert = [];
    }

    programPath.traverse({
      ImportDeclaration(path) {
        if (path.node.source.value === "@grafoo/tag") {
          const defaultSpecifier = path.node.specifiers.find(specifier =>
            isImportDefaultSpecifier(specifier)
          );

          if (!defaultSpecifier) {
            throw path.buildCodeFrameError("@grafoo/tag: no default import.");
          }

          tagNames.push(defaultSpecifier.local.name);

          path.remove();
        }
      },
      TaggedTemplateExpression(path) {
        if (tagNames.some(name => isIdentifier(path.node.tag, { name }))) {
          try {
            const quasi = path.get("quasi");

            if (quasi.get("expressions").length) {
              throw path.buildCodeFrameError(
                "@grafoo/tag: interpolation is not supported in a graphql tagged template literal."
              );
            }

            const source = quasi.node.quasis.reduce((src, q) => src + q.value.raw, "");

            path.replaceWith(parseLiteral(compileDocument(source, opts)));
          } catch (error) {
            if (error.code === "ENOENT") throw error;

            throw path.buildCodeFrameError(error.message);
          }
        }
      }
    });
  }
};

export default function transform() {
  return { visitor };
}
