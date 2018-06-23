import fs from "fs";
import { parse, print } from "graphql";
import compress from "graphql-query-compress";
import path from "path";
import insertFields from "./insert-fields";
import sortDocument from "./sort-query";

let schema;
function getSchema(schemaPath) {
  if (schema) return schema;

  try {
    const fullPath = path.join(process.cwd(), schemaPath);

    fs.accessSync(fullPath, fs.F_OK);

    schema = fs.readFileSync(fullPath, "utf-8");

    return schema;
  } catch (err) {
    throw err;
  }
}

export default function compileDocument(source, opts) {
  const schema = getSchema(opts.schema);
  const document = sortDocument(insertFields(schema, parse(source), opts.idFields));
  const oprs = document.definitions.filter(d => d.kind === "OperationDefinition");
  const frags = document.definitions.filter(d => d.kind === "FragmentDefinition");

  if (oprs.length > 1) {
    throw new Error("@grafoo/core/tag: only one operation definition is accepted per tag.");
  }

  const grafooObj = { query: opts.compress ? compress(print(oprs[0])) : print(oprs[0]) };

  if (oprs.length) {
    grafooObj.paths = oprs[0].selectionSet.selections.reduce(
      (acc, s) =>
        Object.assign(acc, {
          [compress(print(s))]: {
            name: s.name.value,
            args: s.arguments.map(a => a.name.value)
          }
        }),
      {}
    );
  }

  if (frags.length) {
    grafooObj.frags = {};

    for (const frag of frags) {
      grafooObj.frags[frag.name.value] = opts.compress ? compress(print(frag)) : print(frag);
    }
  }

  return grafooObj;
}
