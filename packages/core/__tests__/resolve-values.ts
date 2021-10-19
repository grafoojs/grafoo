import graphql from "@grafoo/core/tag";
import resolveValues from "../src/resolve-values";
import * as postsAndAuthors from "./data/posts-and-authors";
import * as postsWithFragments from "./data/posts-with-fragments";
import * as authorWithArguments from "./data/author-with-arguments";

describe("resolveValues", () => {
  it("should resolve the data given a simple query, a path and the records", () => {
    let query = graphql`
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

    expect(resolveValues(query, postsAndAuthors.path, postsAndAuthors.records)).toEqual(
      postsAndAuthors.data
    );
  });

  it("should resolve the data given a query with fragments, a path and the records", () => {
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

    expect(resolveValues(query, postsWithFragments.path, postsWithFragments.records)).toEqual(
      postsWithFragments.data
    );
  });

  it("should resolve the data given a query with arguments, a path and the records", () => {
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

    expect(
      resolveValues(query, authorWithArguments.path, authorWithArguments.records, variables)
    ).toEqual(authorWithArguments.data);
  });

  it("should resolve the data given a query with fragments and arguments, a path and the records", () => {
    let query = graphql`
      query ($id: ID!, $from: Int, $to: Int) {
        author(id: $id) {
          name
          ...AuthorStuff
        }
      }

      fragment AuthorStuff on Author {
        posts(from: $from, to: $to) {
          title
        }
      }
    `;

    let variables = {
      id: "a1d3a2bc-e503-4640-9178-23cbd36b542c",
      from: 0,
      to: 2
    };

    expect(
      resolveValues(query, authorWithArguments.path, authorWithArguments.records, variables)
    ).toEqual(authorWithArguments.data);
  });
});
