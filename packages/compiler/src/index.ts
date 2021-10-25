import { DocumentNode, buildASTSchema, parse, print, getOperationAST } from "graphql";
import compress from "graphql-query-compress";
import md5Hash from "crypto-js/md5";
import { GrafooQuery } from "@grafoo/core";

import insertFields from "./insert-fields";
import sortDocument from "./sort-query";
import generateClientResolver from "./generate-client-resolvers";

export type Options = {
  schema: string;
  compress?: boolean;
  generateIds?: boolean;
  idFields?: string[];
};

export default function compileDocument(source: string, schemaString: string, opts: Options) {
  let schema = buildASTSchema(parse(schemaString));
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
    fragments: generateClientResolver(schema, fragments)
  };

  if (opts.generateIds) {
    grafooQuery.id = md5Hash(compressedDocumentStr).toString();
  }

  return JSON.stringify(grafooQuery);
}
