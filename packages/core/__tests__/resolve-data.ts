import { graphql } from "@grafoo/core";
import resolveData from "../src/resolve-data";
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

describe("resolveValues", () => {
  it("should resolve the data given a simple query, a path and the records", () => {
    let query = POSTS_AND_AUTHORS;

    let { data } = resolveData(query, {}, postsAndAuthors.path, postsAndAuthors.records);

    expect(data).toEqual(postsAndAuthors.data);
  });

  it("should resolve the data given a query with fragments, a path and the records", () => {
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

    let { data } = resolveData(query, {}, postsWithFragments.path, postsWithFragments.records);

    expect(data).toEqual(postsWithFragments.data);
  });

  it("should resolve the data given a query with arguments, a path and the records", async () => {
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

    let { data } = resolveData(
      query,
      variables,
      authorWithArguments.path,
      authorWithArguments.records
    );

    expect(data).toEqual(authorWithArguments.data);
  });

  it("should resolve the data given a query with fragments and arguments, a path and the records", () => {
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

    let { data } = resolveData(
      query,
      variables,
      authorWithArguments.path,
      authorWithArguments.records
    );

    expect(data).toEqual(authorWithArguments.data);
  });

  it("should yield empty objects for data and records if no paths are given", () => {
    let query = graphql`
      query {
        authors {
          name
        }
      }
    `;

    let { data, partial } = resolveData(query, {}, {}, {});

    expect(data).toEqual({});
    expect(partial).toEqual(true);
  });

  it("should be able to resolve values partially", () => {
    let query = POSTS_AND_AUTHORS;

    let { data, partial } = resolveData(
      query,
      {},
      { authors: postsAndAuthors.path.authors },
      postsAndAuthors.records
    );

    expect(data).toEqual({ authors: postsAndAuthors.data.authors });
    expect(partial).toEqual(true);
  });
});
