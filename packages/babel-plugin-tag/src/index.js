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

        if (!opts.schema) {
          throw new Error("@grafoo/babel-plugin-tag: no schema was specified.");
        }

        if (!opts.fieldsToInsert) {
          opts.fieldsToInsert = [];
        }

        programPath.traverse({
          ImportDeclaration(path) {
            const { source, specifiers } = path.node;

            if (source.value === "@grafoo/tag") {
              const defaultSpecifier = specifiers.find(specifier =>
                t.isImportDefaultSpecifier(specifier)
              );

              if (!defaultSpecifier) {
                throw path.buildCodeFrameError("@grafoo/tag: no default import.");
              }

              tagIdentifiers.push(defaultSpecifier.local.name);

              path.remove();
            }

            if (source.value === "@grafoo/core") {
              const defaultSpecifier = specifiers.find(s => t.isImportDefaultSpecifier(s));

              clientFactoryIdentifiers.push(defaultSpecifier.local.name);
            }
          },

          CallExpression(path) {
            const { arguments: args, callee } = path.node;

            const fieldsToInsert = [];

            for (const field of opts.fieldsToInsert) {
              if (typeof field !== "string") {
                throw path.buildCodeFrameError(
                  "@grafoo/babel-plugin-tag: `fieldsToInsert` fields must be of type string"
                );
              }

              fieldsToInsert.push(t.stringLiteral(field));
            }

            const idFieldsArrayAst = t.arrayExpression(fieldsToInsert);

            const clientObjectAst = t.objectProperty(t.identifier("idFields"), idFieldsArrayAst);

            if (clientFactoryIdentifiers.some(name => t.isIdentifier(callee, { name }))) {
              if (!args[1]) {
                args[1] = t.objectExpression([clientObjectAst]);
              }

              if (t.isObjectExpression(args[1])) {
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
    }
  };
}
