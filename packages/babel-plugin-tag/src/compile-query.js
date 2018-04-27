import fs from "fs";
import path from "path";
import compress from "graphql-query-compress";
import { print, parse } from "graphql";

import insertFields from "./insert-fields";
import sortDocument from "./sort-query";

function getSchema(schemaPath) {
  try {
    const fullPath = path.join(process.cwd(), schemaPath);

    fs.accessSync(fullPath, fs.F_OK);

    return fs.readFileSync(fullPath, "utf-8");
  } catch (err) {
    throw new Error(err);
  }
}

function getPaths(ast) {
  const [definition] = ast.definitions;

  return definition.selectionSet.selections.reduce(
    (paths, s) =>
      Object.assign(paths, {
        [compress(print(s))]: {
          root: s.name.value,
          args: s.arguments.map(a => a.name.value)
        }
      }),
    {}
  );
}

export default function compileQuery(source, opts) {
  const schema = getSchema(opts.schema);
  const document = sortDocument(insertFields(schema, parse(source), opts.fieldsToInsert));

  return {
    query: process.env.NODE_ENV !== "production" ? print(document) : compress(print(document)),
    paths: getPaths(document)
  };
}
