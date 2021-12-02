import * as fs from "fs";
import * as path from "path";
import {
  DocumentNode,
  GraphQLSchema,
  buildASTSchema,
  getOperationAST,
  parse,
  print
} from "graphql";
import compress from "graphql-query-compress";
import md5Hash from "crypto-js/md5";
import { GrafooQuery } from "@grafoo/core";

import insertFields from "./insert-fields";
import sortDocument from "./sort-query";
import generateClientResolver from "./generate-client-resolvers";

export type Options = {
  schema: string;
  idFields: string[];
  compress?: boolean;
  generateIds?: boolean;
};

let cache = new Map();

export default function compileDocument(source: string) {
  if (!cache.has("opts")) {
    let opts = getOptions();

    if (!["schema", "idFields"].some((f) => Object.keys(opts).includes(f))) {
      throw new Error(
        "The `schema` and `idFields` options are required. Please include then in your .grafoorc."
      );
    }

    opts.compress = opts.compress ?? process.env.NODE_ENV === "production";
    opts.generateIds = opts.generateIds ?? false;

    cache.set("opts", opts);
  }

  let opts: Options = cache.get("opts");
  let schemaString = getSchema(opts.schema);
  let schema: GraphQLSchema;
  try {
    schema = buildASTSchema(parse(schemaString));
  } catch (error) {
    error.message = `Failed to parse ${path.join(process.cwd(), opts.schema)}.`;
    throw error;
  }

  let document = sortDocument(insertFields(schema, parse(source), opts.idFields)) as DocumentNode;
  let operation = getOperationAST(document);
  let fragments = {
    ...document,
    definitions: document.definitions.filter((d) => d.kind === "FragmentDefinition")
  };
  let documentStr = print(document);
  let compressedDocumentStr = compress(documentStr);

  let grafooQuery: GrafooQuery = {
    document: opts.compress ? compressedDocumentStr : documentStr,
    operation: generateClientResolver(schema, operation),
    fragments: fragments.definitions.length ? generateClientResolver(schema, fragments) : undefined
  };

  if (opts.generateIds) {
    grafooQuery.id = md5Hash(compressedDocumentStr).toString();
  }

  return JSON.stringify(grafooQuery);
}

export function getOptions(): Options {
  try {
    let paths = [".grafoorc.json", ".grafoorc"].map((p) => path.join(process.cwd(), p));
    let configPath = paths.find((p) => fs.existsSync(p));

    fs.accessSync(configPath);

    let config = fs.readFileSync(configPath, "utf-8");

    return JSON.parse(config);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error("Could not find a .grafoorc or .grafoorc.json in the root directory.");
    }

    throw error;
  }
}

export function getSchema(schemaPath: string) {
  try {
    let fullPath = path.join(process.cwd(), schemaPath);

    fs.accessSync(fullPath);

    let schema = fs.readFileSync(fullPath, "utf-8");

    return schema;
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(
        "Could not find a schema in the root directory. " +
          "Please specify the `schema` option in your .grafoorc file."
      );
    }

    throw error;
  }
}
