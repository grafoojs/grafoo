import * as fs from "fs";
import * as path from "path";
import type bc from "@babel/core";
import { parseExpression } from "@babel/parser";
import { createMacro } from "babel-plugin-macros";
import compileDocument, { Options } from "@grafoo/compiler";
import { graphql } from "@grafoo/core";

let map = new Map();

export default createMacro(({ references }) => {
  if (!map.has("opts")) map.set("opts", getOptions());
  if (!map.has("schema")) map.set("schema", getSchema(map.get("opts").schema));

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

      try {
        let source = quasi.node.quasis.reduce((src, q) => src + q.value.raw, "");
        let query = compileDocument(source, map.get("schema"), map.get("opts"));
        targetPath.replaceWith(parseExpression(query));
      } catch (error) {
        throw quasi.buildCodeFrameError(error.message);
      }
    }
  }
}) as typeof graphql;

function getOptions(): Options {
  try {
    let jsonPath = path.join(process.cwd(), "package.json");

    fs.accessSync(jsonPath, fs.constants.F_OK);

    let pkg = fs.readFileSync(jsonPath, "utf-8");

    return JSON.parse(pkg).grafooConfig ?? {};
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(
        "Could not find a schema in the root directory. " +
          "Please use the `schema` option to specify your schema path"
      );
    }

    throw error;
  }
}

function getSchema(schemaPath: string) {
  try {
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

    // @ts-ignore
    fs.accessSync(fullPath, fs.F_OK);

    let schema = fs.readFileSync(fullPath, "utf-8");

    return schema;
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(
        "Could not find a schema in the root directory. " +
          "Please use the `schema` option to specify your schema path"
      );
    }

    throw error;
  }
}
