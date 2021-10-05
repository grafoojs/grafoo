import parseLiteral from "babel-literal-to-ast";
import compileDocument from "./compile-document";

export default function transform({ types: t }) {
  return {
    visitor: {
      Program(programPath, { opts }) {
        let tagIdentifiers = [];
        let clientFactoryIdentifiers = [];

        if (typeof opts.compress !== "boolean") {
          opts.compress = process.env.NODE_ENV === "production";
        }

        if (typeof opts.generateIds !== "boolean") {
          opts.generateIds = false;
        }

        if (!opts.idFields) {
          throw new Error("@grafoo/babel-plugin: the `idFields` option is required.");
        }

        if (
          !Array.isArray(opts.idFields) ||
          opts.idFields.some((field) => typeof field !== "string")
        ) {
          throw new Error(
            "@grafoo/babel-plugin: the `idFields` option must be declared as an array of strings."
          );
        }

        programPath.traverse({
          ImportDeclaration(path) {
            let { source, specifiers } = path.node;

            if (source.value === "@grafoo/core") {
              let defaultSpecifier = specifiers.find((s) => t.isImportDefaultSpecifier(s));
              if (defaultSpecifier) {
                clientFactoryIdentifiers.push(defaultSpecifier.local.name);
              }
            }

            if (source.value === "@grafoo/core/tag") {
              let defaultSpecifier = specifiers.find((specifier) =>
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
            let { arguments: args, callee } = path.node;

            let idFieldsArrayAst = t.arrayExpression(
              opts.idFields.map((field) => t.stringLiteral(field))
            );

            let clientObjectAst = t.objectProperty(t.identifier("idFields"), idFieldsArrayAst);

            if (clientFactoryIdentifiers.some((name) => t.isIdentifier(callee, { name }))) {
              if (!args[1]) {
                args[1] = t.objectExpression([clientObjectAst]);
              }

              if (t.isIdentifier(args[1])) {
                let name = args[1].name;
                let { init } = path.scope.bindings[name].path.node;

                if (path.scope.hasBinding(name)) {
                  if (t.isObjectExpression(init)) {
                    let idFieldsProp = init.properties.find((arg) => arg.key.name === "idFields");

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
                let idFieldsProp = args[1].properties.find((arg) => arg.key.name === "idFields");

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
            if (tagIdentifiers.some((name) => t.isIdentifier(path.node.tag, { name }))) {
              let quasi = path.get("quasi");

              if (quasi.get("expressions").length) {
                throw path.buildCodeFrameError(
                  "@grafoo/core/tag: interpolation is not supported in a graphql tagged template literal."
                );
              }

              try {
                let source = quasi.node.quasis.reduce((src, q) => src + q.value.raw, "");
                path.replaceWith(parseLiteral(compileDocument(source, opts)));
              } catch (error) {
                if (error.code === "ENOENT") {
                  throw new Error(
                    "Could not find a schema in the root directory! " +
                      "Please use the `schema` option to specify your schema path"
                  );
                }

                throw path.buildCodeFrameError(error);
              }
            }
          }
        });
      }
    }
  };
}
