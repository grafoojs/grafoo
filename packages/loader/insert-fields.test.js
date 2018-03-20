const fs = require("fs");
const expect = require("expect");
const { parse, print } = require("graphql");

const insertFields = require("./insert-fields");

const schema = fs.readFileSync("./schema.graphql", "utf-8");

describe("insertFields", () => {
  it("should insert a field", () => {
    const query = `{ user { name } }`;

    const expected = `{ user { name id } }`;

    expect(print(insertFields(schema, parse(query), ["id"]))).toBe(print(parse(expected)));
  });

  it("should insert more then a field if specified", () => {
    const query = `{ user { name } }`;

    const expected = `{ user { name username email id } }`;

    expect(print(insertFields(schema, parse(query), ["username", "email", "id"]))).toBe(
      print(parse(expected))
    );
  });

  it("should insert `__typename` if specified", () => {
    const query = `{ user { name } } `;

    const expected = `{ user { name __typename } }`;

    expect(print(insertFields(schema, parse(query), ["__typename"]))).toBe(print(parse(expected)));
  });
});
