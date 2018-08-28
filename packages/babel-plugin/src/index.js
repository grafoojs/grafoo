import parseLiteral from "babel-literal-to-ast";
import compileDocument from "./compile-document";

export default function transform({ types: t }) {
  return {
    visitor: {
      Program(programPath, { opts }) {
        const tagIdentifiers = [];
        const clientFactoryIdentifiers = [];

        if (typeof opts.compress !== "boolean") {
          opts.compress = process.env.NODE_ENV === "production";
        }

        if (!opts.idFields) {
          throw new Error("@grafoo/babel-plugin: the `idFields` option is required.");
        }

        if (
          !Array.isArray(opts.idFields) ||
          opts.idFields.some(field => typeof field !== "string")
        ) {
          throw new Error(
            "@grafoo/babel-plugin: the `idFields` option must be declared as an array of strings."
          );
        }

        programPath.traverse({
          ImportDeclaration(path) {
            const { source, specifiers } = path.node;

            if (source.value === "@grafoo/core") {
              const defaultSpecifier = specifiers.find(s => t.isImportDefaultSpecifier(s));

              clientFactoryIdentifiers.push(defaultSpecifier.local.name);
            }

            if (source.value === "@grafoo/core/tag") {
              const defaultSpecifier = specifiers.find(specifier =>
                t.isImportDefaultSpecifier(specifier)
              );

              if (!defaultSpecifier) {
                throw path.buildCodeFrameError("@grafoo/core/tag: no default import.");
              }

              tagIdentifiers.push(defaultSpecifier.local.name);

              path.remove();
            }
          },

          CallExpression(path) {
            const { arguments: args, callee } = path.node;

            const idFieldsArrayAst = t.arrayExpression(
              opts.idFields.map(field => t.stringLiteral(field))
            );

            const clientObjectAst = t.objectProperty(t.identifier("idFields"), idFieldsArrayAst);

            if (clientFactoryIdentifiers.some(name => t.isIdentifier(callee, { name }))) {
              if (!args[1]) {
                args[1] = t.objectExpression([clientObjectAst]);
              }

              if (t.isIdentifier(args[1])) {
                const name = args[1].name;
                const { init } = path.scope.bindings[name].path.node;

                if (path.scope.hasBinding(name)) {
                  if (t.isObjectExpression(init)) {
                    const idFieldsProp = init.properties.find(arg => arg.key.name === "idFields");

                    if (idFieldsProp) {
                      idFieldsProp.value = idFieldsArrayAst;
                    } else {
                      init.properties.push(clientObjectAst);
                    }
                  } else {
                    throw path.buildCodeFrameError(
                      callee.name +
                        " second argument must be of type object, instead got " +
                        args[1].type +
                        "."
                    );
                  }
                }
              } else if (t.isObjectExpression(args[1])) {
                const idFieldsProp = args[1].properties.find(arg => arg.key.name === "idFields");

                if (idFieldsProp) {
                  idFieldsProp.value = idFieldsArrayAst;
                } else {
                  args[1].properties.push(clientObjectAst);
                }
              } else {
                throw path.buildCodeFrameError(
                  callee.name +
                    " second argument must be of type object, instead got " +
                    args[1].type +
                    "."
                );
              }
            }
          },

          TaggedTemplateExpression(path) {
            if (tagIdentifiers.some(name => t.isIdentifier(path.node.tag, { name }))) {
              try {
                const quasi = path.get("quasi");

                if (quasi.get("expressions").length) {
                  throw path.buildCodeFrameError(
                    "@grafoo/core/tag: interpolation is not supported in a graphql tagged template literal."
                  );
                }

                const source = quasi.node.quasis.reduce((src, q) => src + q.value.raw, "");

                path.replaceWith(parseLiteral(compileDocument(source, opts)));
              } catch (error) {
                if (error.code === "ENOENT") {
                  throw new Error(
                    "Could not find a schema in the root directory! " +
                      "Please use the `schema` option to specify your schema path, " +
                      "or the `schemaUrl` to specify your graphql endpoint."
                  );
                }

                throw path.buildCodeFrameError(error.message);
              }
            }
          }
        });
      }
    }
  };
}
