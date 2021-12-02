import { graphql } from "@grafoo/core";
import storeValues from "../src/store-values";
import * as postsAndAuthors from "./data/posts-and-authors";
import * as postsWithFragments from "./data/posts-with-fragments";
import * as authorWithArguments from "./data/author-with-arguments";

let POSTS_AND_AUTHORS = graphql`
  query {
    posts {
      edges {
        node {
          title
          body
          author {
            name
          }
        }
      }
    }

    authors {
      edges {
        node {
          name
          posts {
            edges {
              node {
                body
                title
              }
            }
          }
        }
      }
    }
  }
`;

let idFields = ["id"];

describe("storeValues", () => {
  it("should yield correct path and records to a normal query", () => {
    let query = POSTS_AND_AUTHORS;

    let { paths, records } = storeValues(query, {}, postsAndAuthors.data, idFields);

    expect(paths).toEqual(postsAndAuthors.path);
    expect(records).toEqual(postsAndAuthors.records);
  });

  it("should yield correct path and records to queries with fragments", () => {
    let query = graphql`
      query {
        posts {
          edges {
            node {
              ...P
            }
          }
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
          edges {
            node {
              title
            }
          }
        }
      }
    `;

    let { paths, records } = storeValues(query, {}, postsWithFragments.data, idFields);

    expect(paths).toEqual(postsWithFragments.path);
    expect(records).toEqual(postsWithFragments.records);
  });

  it("should yield correct path and records to queries with arguments", () => {
    let query = graphql`
      query ($id: ID!, $first: Int!) {
        author(id: $id) {
          name
          posts(first: $first) {
            edges {
              node {
                title
              }
            }
          }
        }
      }
    `;

    let variables = {
      id: "QXV0aG9yOmExZDNhMmJjLWU1MDMtNDY0MC05MTc4LTIzY2JkMzZiNTQyYw==",
      first: 1
    };

    let { paths, records } = storeValues(query, variables, authorWithArguments.data, idFields);

    expect(paths).toEqual(authorWithArguments.path);
    expect(records).toEqual(authorWithArguments.records);
  });

  it("should yield correct path and records to queries with arguments and fragments", () => {
    let query = graphql`
      query ($id: ID!, $first: Int) {
        author(id: $id) {
          name
          ...AuthorStuff
        }
      }

      fragment AuthorStuff on Author {
        posts(first: $first) {
          edges {
            node {
              title
            }
          }
        }
      }
    `;

    let variables = {
      id: "QXV0aG9yOmExZDNhMmJjLWU1MDMtNDY0MC05MTc4LTIzY2JkMzZiNTQyYw==",
      first: 1
    };

    let { paths, records } = storeValues(query, variables, authorWithArguments.data, idFields);

    expect(paths).toEqual(authorWithArguments.path);
    expect(records).toEqual(authorWithArguments.records);
  });

  it("should deal correctly with null values", () => {
    let query = graphql`
      query {
        authors {
          edges {
            node {
              name
            }
          }
        }
      }
    `;

    let data = { authors: postsAndAuthors.data.authors };

    data.authors.edges[0].node.posts = null;

    let { paths } = storeValues(query, {}, data, idFields);

    expect(paths).toEqual({
      authors: {
        __typename: "AuthorConnection",
        edges: [
          {
            __typename: "AuthorEdge",
            node: {
              id: "QXV0aG9yOmExZDNhMmJjLWU1MDMtNDY0MC05MTc4LTIzY2JkMzZiNTQyYw==",
              posts: null
            }
          },
          {
            __typename: "AuthorEdge",
            node: {
              id: "QXV0aG9yOmExZDFjM2YwLTViZDUtNDUzZS1iNGY4LTlmNDE5NDU3ZTVhNg==",
              posts: {
                edges: [
                  {
                    node: {
                      id: "UG9zdDphMmJjZTVmOC0yZWI3LTQyM2QtOTk0Zi1kODAwMmJkMDUwOWY="
                    }
                  },
                  {
                    node: {
                      id: "UG9zdDpiYmI5NjgyMS0wNmZhLTRlMTYtOWUxYi0zYzJhNmZiNzcxMGQ="
                    }
                  }
                ]
              }
            }
          }
        ]
      }
    });
  });
});
