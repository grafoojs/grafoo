import * as fs from "fs";
import * as path from "path";
import { parse, buildASTSchema } from "graphql";

import generateClientResolver from "../src/generate-client-resolvers";

let graphql = (s: TemplateStringsArray) => parse(s[0]);
let schemaString = fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf-8");
let schema = buildASTSchema(parse(schemaString));

describe("generateClientResolver", () => {
  it("should create the client resolver object in the correct shape", () => {
    let query = graphql`
      query {
        posts {
          id
          ...PostStuff
          author {
            ...AuthorStuff
          }
        }

        author {
          id
          name
          posts {
            ... on Post {
              id
              title
            }
          }
        }
      }
    `;

    expect(generateClientResolver(schema, query)).toEqual({
      select: [
        {
          name: "posts",
          scalars: ["id"],
          fragments: ["PostStuff"],
          select: [
            {
              name: "author",
              fragments: ["AuthorStuff"]
            }
          ]
        },
        {
          name: "author",
          scalars: ["id", "name"],
          select: [
            {
              name: "posts",
              scalars: ["id", "title"]
            }
          ]
        }
      ]
    });

    let fragments = graphql`
      fragment AuthorStuff on Author {
        id
        name
        posts(from: 1, to: 10) {
          ...PostStuff
          id
        }
      }

      fragment PostStuff on Post {
        title
      }
    `;

    expect(generateClientResolver(schema, fragments)).toEqual({
      select: [
        {
          name: "AuthorStuff",
          scalars: ["id", "name"],
          select: [
            {
              name: "posts",
              args: ["from", "to"],
              fragments: ["PostStuff"],
              scalars: ["id"]
            }
          ]
        },
        {
          name: "PostStuff",
          scalars: ["title"]
        }
      ]
    });
  });
});

// const values = {
//   posts: [
//     ["record", { author: "record" }],
//     ["record", { author: "record" }],
//     ["record", { author: "record" }],
//     ["record", { author: "record" }],
//     ["record", { author: "record" }],
//     ["record", { author: "record" }],
//     ["record", { author: "record" }],
//     ["record", { author: "record" }],
//   ],
//   authors: [
//     ["record", { posts: ["record", "record", "record", "record"] }],
//     ["record", { posts: ["record", "record", "record", "record"] }],
//   ]
// }
