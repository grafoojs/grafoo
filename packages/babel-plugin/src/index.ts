import * as fs from "fs";
import * as path from "path";
import type * as BabelCoreNamespace from "@babel/core";
import type { PluginObj } from "@babel/core";
import { parseExpression } from "@babel/parser";
import compileDocument, { Options } from "@grafoo/compiler";

type Babel = typeof BabelCoreNamespace;

let schema: string;
function getSchema(schemaPath: string) {
  try {
    if (schema) return schema;

    let fullPath: string;

    if (!schemaPath) {
      let schemaJson = path.join(process.cwd(), "schema.json");
      let schemaGraphql = path.join(process.cwd(), "schema.graphql");
      let schemaGql = path.join(process.cwd(), "schema.gql");

      fullPath = fs.existsSync(schemaJson)
        ? schemaJson
        : fs.existsSync(schemaGraphql)
        ? schemaGraphql
        : fs.existsSync(schemaGql)
        ? schemaGql
        : undefined;
    } else {
      fullPath = path.join(process.cwd(), schemaPath);
    }

    fs.accessSync(fullPath, fs.constants.F_OK);

    schema = fs.readFileSync(fullPath, "utf-8");

    return schema;
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(
        "Could not find a schema in the root directory! " +
          "Please use the `schema` option to specify your schema path"
      );
    }

    throw error;
  }
}

export default function transform({ types: t }: Babel): PluginObj<{ opts: Options }> {
  return {
    visitor: {
      Program(programPath, { opts }) {
        let schemaString = getSchema(opts.schema);
        let tagIdentifiers = [];
        let clientFactoryIdentifiers = [];

        if (typeof opts.compress !== "boolean") {
          opts.compress = true;
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
              let gqlTag = specifiers.find(
                (s) => s.local.name === "graphql" || s.local.name === "gql"
              );

              if (defaultSpecifier) {
                clientFactoryIdentifiers.push(defaultSpecifier.local.name);
              }

              if (gqlTag) {
                tagIdentifiers.push(gqlTag.local.name);

                if (specifiers.length === 1) {
                  path.remove();
                }
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
                // @ts-ignore
                let { init } = path.scope.bindings[name].path.node;

                if (path.scope.hasBinding(name)) {
                  if (t.isObjectExpression(init)) {
                    // @ts-ignore
                    let idFieldsProp = init.properties.find((arg) => arg.key.name === "idFields");

                    if (idFieldsProp) {
                      // @ts-ignore
                      idFieldsProp.value = idFieldsArrayAst;
                    } else {
                      init.properties.push(clientObjectAst);
                    }
                  } else {
                    throw path.buildCodeFrameError(
                      // @ts-ignore
                      callee.name +
                        " second argument must be of type object, instead got " +
                        args[1].type +
                        "."
                    );
                  }
                }
              } else if (t.isObjectExpression(args[1])) {
                // @ts-ignore
                let idFieldsProp = args[1].properties.find((arg) => arg.key.name === "idFields");

                if (idFieldsProp) {
                  // @ts-ignore
                  idFieldsProp.value = idFieldsArrayAst;
                } else {
                  args[1].properties.push(clientObjectAst);
                }
              } else {
                throw path.buildCodeFrameError(
                  // @ts-ignore
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
              let expressions = quasi.get("expressions");

              if (expressions.length) {
                throw expressions[0].buildCodeFrameError(
                  "@grafoo/core/tag: interpolation is not supported in a graphql tagged template literal."
                );
              }

              try {
                let source = quasi.node.quasis.reduce((src, q) => src + q.value.raw, "");
                let query = compileDocument(source, schemaString, opts);
                path.replaceWith(parseExpression(query));
              } catch (error) {
                throw quasi.buildCodeFrameError(error);
              }
            }
          }
        });
      }
    }
  };
}
