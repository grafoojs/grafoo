const fs = require("fs");
const path = require("path");
const compress = require("graphql-query-compress");
const { print, parse } = require("graphql");

const insertFields = require("./insert-fields");
const sortDocument = require("./sort-query");

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

module.exports = function compileQuery(source, opts) {
  if (!opts.schema) {
    throw new Error("@grafoo/loader needs a schema!");
  }

  if (!opts.fields) opts.fields = [];

  const schema = getSchema(opts.schema);

  const document = sortDocument(insertFields(schema, parse(source), opts.fields));

  return {
    query: process.env.NODE_ENV !== "production" ? print(document) : compress(print(document)),
    paths: getPaths(document)
  };
};
