const { isImportDefaultSpecifier, isIdentifier } = require("babel-types");
const parseLiteral = require("babel-literal-to-ast");

const compileQuery = require("./compile-query");

module.exports = function transform() {
  return {
    visitor: {
      Program(programPath, { opts }) {
        const tagNames = [];

        programPath.traverse({
          ImportDeclaration(path) {
            if (path.node.source.value === "@grafoo/loader") {
              const defaultSpecifier = path.node.specifiers.find(specifier =>
                isImportDefaultSpecifier(specifier)
              );

              if (!defaultSpecifier) {
                throw new Error("@grafoo/loader is a default import!");
              }

              const importToken = defaultSpecifier.local.name;

              if (importToken !== "gql" && importToken !== "graphql") {
                throw new Error(
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
                  throw new Error(
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
    }
  };
};
