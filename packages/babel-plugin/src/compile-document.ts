import * as fs from "fs";
import * as path from "path";
import { DocumentNode, buildASTSchema, parse, print, getOperationAST } from "graphql";
import compress from "graphql-query-compress";
import md5Hash from "crypto-js/md5";
import { GrafooQuery } from "@grafoo/core";

import insertFields from "./insert-fields";
import sortDocument from "./sort-query";
import { Options } from ".";
import generateClientResolver from "./generate-client-resolvers";

let schema: string;
function getSchema(schemaPath: string) {
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

  // @ts-ignore
  fs.accessSync(fullPath, fs.F_OK);

  schema = fs.readFileSync(fullPath, "utf-8");

  return schema;
}

export default function compileDocument(source: string, opts: Options) {
  let schemaString = getSchema(opts.schema);
  let schema = buildASTSchema(parse(schemaString));
  let document = sortDocument(insertFields(schema, parse(source), opts.idFields)) as DocumentNode;
  let operation = getOperationAST(document);
  let fragments: DocumentNode = {
    ...document,
    definitions: document.definitions.filter((d) => d.kind === "FragmentDefinition")
  };
  let compressedDocument = compress(print(document));
  let grafooQuery: GrafooQuery = {
    document: compressedDocument,
    operation: generateClientResolver(schema, operation),
    fragments: generateClientResolver(schema, fragments)
  };

  if (opts.generateIds) {
    grafooQuery.id = md5Hash(compressedDocument).toString();
  }

  return JSON.stringify(grafooQuery);
}
