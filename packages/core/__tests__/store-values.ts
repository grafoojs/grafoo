import graphql from "@grafoo/core/tag";
import storeValues from "../src/store-values";
import * as postsAndAuthors from "./data/posts-and-authors";
import * as postsWithFragments from "./data/posts-with-fragments";
import * as authorWithArguments from "./data/author-with-arguments";

let idFields = ["id"];

describe("storeValues", () => {
  test("should yield correct path and records to a normal query", () => {
    let POSTS_AND_AUTHORS = graphql`
      query {
        posts {
          title
          body
          author {
            name
          }
        }

        authors {
          name
          posts {
            title
            body
          }
        }
      }
    `;

    let { path, records } = storeValues(postsAndAuthors.data, POSTS_AND_AUTHORS, idFields);

    expect(path).toEqual(postsAndAuthors.path);
    expect(records).toEqual(postsAndAuthors.records);
  });

  test("should yield correct path and records to queries with fragments", () => {
    let query = graphql`
      query {
        posts {
          ...P
        }
      }

      fragment P on Post {
        title
        body
        author {
          ...A
        }
      }

      fragment A on Author {
        name
        posts {
          title
        }
      }
    `;

    let { path, records } = storeValues(postsWithFragments.data, query, idFields);

    expect(path).toEqual(postsWithFragments.path);
    expect(records).toEqual(postsWithFragments.records);
  });

  test("should yield correct path and records to queries with arguments", () => {
    let query = graphql`
      query ($id: ID!, $from: Int, $to: Int) {
        author(id: $id) {
          name
          posts(from: $from, to: $to) {
            title
          }
        }
      }
    `;

    let variables = {
      id: "a1d3a2bc-e503-4640-9178-23cbd36b542c",
      from: 0,
      to: 2
    };

    let { path, records } = storeValues(authorWithArguments.data, query, idFields, variables);

    expect(path).toEqual(authorWithArguments.path);
    expect(records).toEqual(authorWithArguments.records);
  });

  test("should yield correct path and records to queries with arguments and fragments", () => {
    let query = graphql`
      query ($id: ID!, $from: Int, $to: Int) {
        author(id: $id) {
          name
          posts(from: $from, to: $to) {
            ...PostStuff
          }
        }
      }

      fragment PostStuff on Post {
        title
      }
    `;

    let variables = {
      id: "a1d3a2bc-e503-4640-9178-23cbd36b542c",
      from: 0,
      to: 2
    };

    let { path, records } = storeValues(authorWithArguments.data, query, idFields, variables);

    expect(path).toEqual(authorWithArguments.path);
    expect(records).toEqual(authorWithArguments.records);
  });
});
