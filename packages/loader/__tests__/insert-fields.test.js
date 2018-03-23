import fs from "fs";
import path from "path";
import test from "ava";
import { parse, print } from "graphql";

import insertFields from "../src/insert-fields";

const schema = fs.readFileSync(path.join(__dirname, "..", "schema.graphql"), "utf-8");

const cases = [
  {
    name: "should insert a field",
    query: "{ user { name } }",
    expected: "{ user { name id } }",
    fields: ["id"]
  },
  {
    name: "should insert more then a field if specified",
    query: "{ user { name } }",
    expected: "{ user { name username email id } }",
    fields: ["username", "email", "id"]
  },
  {
    name: "should insert `__typename` if specified",
    query: "{ user { name } }",
    expected: "{ user { name __typename } }",
    fields: ["__typename"]
  },
  {
    name: "should insert props in queries with fragments",
    query: `
      {
        user {
          ...UserFrag
        }
      }

      fragment UserFrag on User {
        name
        posts {
          title
        }
      }
    `,
    expected: `
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
    fields: ["id"]
  },
  {
    name: "should insert props in queries with inline fragments",
    query: `
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
    expected: `
      {
        user {
          name
          ...on Author {
            posts {
              title
              id
            }
          }
        }
      }
    `,
    fields: ["id"]
  }
];

for (const { name, query, expected, fields } of cases) {
  test(name, t => {
    t.is(print(insertFields(schema, parse(query), fields)), print(parse(expected)));
  });
}
