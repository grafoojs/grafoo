import * as fs from "fs";
import * as path from "path";
import {
  DocumentNode,
  FieldNode,
  FragmentDefinitionNode,
  buildASTSchema,
  parse,
  print,
  getOperationAST
} from "graphql";
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
  let frags = document.definitions.filter(
    (d) => d.kind === "FragmentDefinition"
  ) as FragmentDefinitionNode[];

  let grafooQuery = {} as GrafooQuery;

  let operation = getOperationAST(document);
  let fragments: DocumentNode = {
    ...document,
    definitions: document.definitions.filter((d) => d.kind === "FragmentDefinition")
  };

  if (operation) {
    let compressedQuery = compress(print(operation));

    // Use compressedQuery version to get same hash even if
    // query has different whitespaces, newlines, etc
    // Document is also sorted by "sortDocument" therefore
    // selections, fields, etc order shouldn't matter either
    if (opts.generateIds) {
      // @ts-ignore
      grafooQuery.id = md5Hash(compressedQuery).toString();
    }

    grafooQuery.query = compressedQuery;

    grafooQuery.paths = (operation.selectionSet.selections as FieldNode[]).reduce(
      (acc, s) =>
        Object.assign(acc, {
          // TODO: generate hashes as well
          // based on compress(print(s))?
          [compress(print(s))]: {
            name: s.name.value,
            args: s.arguments.map((a) => a.name.value)
          }
        }),
      {}
    );
  }

  grafooQuery.selections = generateClientResolver(schema, operation);
  grafooQuery.fragments = generateClientResolver(schema, fragments);

  if (frags.length) {
    grafooQuery.frags = {};

    for (let frag of frags) {
      grafooQuery.frags[frag.name.value] = compress(print(frag));
    }
  }

  return JSON.stringify(grafooQuery);
}
