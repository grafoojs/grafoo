import fs from "fs";
import { parse, print } from "graphql";
import compress from "graphql-query-compress";
import path from "path";
import insertFields from "./insert-fields";
import sortDocument from "./sort-query";

const DEV = process.env.NODE_ENV !== "production";

function getSchema(schemaPath) {
  try {
    const fullPath = path.join(process.cwd(), schemaPath);

    fs.accessSync(fullPath, fs.F_OK);

    return fs.readFileSync(fullPath, "utf-8");
  } catch (err) {
    throw err;
  }
}

export default function compileDocument(source, opts) {
  const schema = getSchema(opts.schema);
  const document = sortDocument(insertFields(schema, parse(source), opts.fieldsToInsert));
  const oprs = document.definitions.filter(d => d.kind === "OperationDefinition");
  const frags = document.definitions.filter(d => d.kind === "FragmentDefinition");

  if (oprs.length > 1) {
    throw new Error("@grafoo/tag: only one operation definition is accepted per tag.");
  }

  const grafooObj = { query: DEV ? print(oprs[0]) : compress(print(oprs[0])) };

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
      Object.assign(
        grafooObj.frags,
        frag.selectionSet.selections.reduce(
          (acc, s) =>
            Object.assign(acc, {
              [s.name.value]: compress(print(s))
            }),
          {}
        )
      );
    }
  }

  return grafooObj;
}
