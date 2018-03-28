import fs from "fs";
import path from "path";
import test from "ava";
import { parse, print } from "graphql";

import insertFields from "../src/insert-fields";

const schema = fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf-8");

const cases = [
  {
    title: "should insert a field",
    input: "{ author { name } }",
    expectedOutput: "{ author { name id } }",
    fieldsToInsert: ["id"]
  },
  {
    title: "should insert more then a field if specified",
    input: "{ author { name } }",
    expectedOutput: "{ author { name username email id } }",
    fieldsToInsert: ["username", "email", "id"]
  },
  {
    title: "should insert `__typename` if specified",
    input: "{ author { name } }",
    expectedOutput: "{ author { name __typename } }",
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
  },
  {
    title: "should not insert `__typename` inside fragments",
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
          __typename
        }
      }

      fragment UserFrag on Author {
        name
        posts {
          title
          __typename
        }
      }
    `,
    fieldsToInsert: ["__typename"]
  },
  {
    title: "should not insert `__typename` inside inline fragments",
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
              __typename
            }
          }
          __typename
        }
      }
    `,
    fieldsToInsert: ["__typename"]
  },
  {
    title: "should insert field present on a fragment",
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
        }
      }

      fragment UserFrag on Author {
        name
        posts {
          title
        }
        bio
      }
    `,
    fieldsToInsert: ["bio"]
  },
  {
    title: "should insert field present on an inline fragment",
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
            }
            bio
          }
        }
      }
    `,
    fieldsToInsert: ["bio"]
  }
];

for (const { title, input, expectedOutput, fieldsToInsert } of cases) {
  test(title, t => {
    t.is(print(insertFields(schema, parse(input), fieldsToInsert)), print(parse(expectedOutput)));
  });
}
