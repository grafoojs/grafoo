const fs = require("fs");
const test = require("ava");
const { parse, print } = require("graphql");

const insertFields = require("./insert-fields");

const schema = fs.readFileSync("./schema.graphql", "utf-8");

test("should insert a field", t => {
  const query = `{ user { name } }`;
  const expected = `{ user { name id } }`;

  t.is(print(insertFields(schema, parse(query), ["id"])), print(parse(expected)));
});

test("should insert more then a field if specified", t => {
  const query = `{ user { name } }`;
  const expected = `{ user { name username email id } }`;

  t.is(
    print(insertFields(schema, parse(query), ["username", "email", "id"])),
    print(parse(expected))
  );
});

test("should insert `__typename` if specified", t => {
  const query = `{ user { name } } `;
  const expected = `{ user { name __typename } }`;

  t.is(print(insertFields(schema, parse(query), ["__typename"])), print(parse(expected)));
});
