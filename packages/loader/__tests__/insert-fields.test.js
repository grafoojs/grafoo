import fs from "fs";
import path from "path";
import test from "ava";
import { parse, print } from "graphql";

import insertFields from "../src/insert-fields";

const schema = fs.readFileSync(path.join(__dirname, "..", "schema.graphql"), "utf-8");

const cases = [
  {
    title: "should insert a field",
    input: "{ user { name } }",
    expectedOutput: "{ user { name id } }",
    fieldsToInsert: ["id"]
  },
  {
    title: "should insert more then a field if specified",
    input: "{ user { name } }",
    expectedOutput: "{ user { name username email id } }",
    fieldsToInsert: ["username", "email", "id"]
  },
  {
    title: "should insert `__typename` if specified",
    input: "{ user { name } }",
    expectedOutput: "{ user { name __typename } }",
    fieldsToInsert: ["__typename"]
  },
  {
    title: "should insert props in queries with fragments",
    input: `
      {
        user {
          ...UserFrag
        }
      }

      fragment UserFrag on Author {
        name
        posts {
          title
        }
      }
    `,
    expectedOutput: `
      {
        user {
          ...UserFrag
          id
        }
      }

      fragment UserFrag on Author {
        name
        posts {
          title
          id
        }
      }
    `,
    fieldsToInsert: ["id"]
  },
  {
    title: "should insert props in queries with inline fragments",
    input: `
      {
        user {
          name
          ...on Author {
            posts {
              title
            }
          }
        }
      }
    `,
    expectedOutput: `
      {
        user {
          name
          ...on Author {
            posts {
              title
              id
              __typename
            }
          }
          id
          __typename
        }
      }
    `,
    fieldsToInsert: ["id", "__typename"]
  }
];

for (const { title, input, expectedOutput, fieldsToInsert } of cases) {
  test(title, t => {
    t.is(print(insertFields(schema, parse(input), fieldsToInsert)), print(parse(expectedOutput)));
  });
}
