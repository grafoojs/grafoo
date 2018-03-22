import fs from "fs";
import path from "path";
import test from "ava";
import { parse, print } from "graphql";

import insertFields from "../insert-fields";

const schema = fs.readFileSync(path.join(__dirname, "..", "schema.graphql"), "utf-8");

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
