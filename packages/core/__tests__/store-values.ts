import graphql from "@grafoo/core/tag";
import storeValues from "../src/store-values";
import * as postsAndAuthors from "./data/posts-and-authors";
import * as postsWithFragments from "./data/posts-with-fragments";
import * as authorWithArguments from "./data/author-with-arguments";

let idFields = ["id"];

describe("storeValues", () => {
  it("should yield correct path and records to a normal query", () => {
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

    let { path, records } = storeValues(query, {}, postsAndAuthors.data, idFields);

    expect(path).toEqual(postsAndAuthors.path);
    expect(records).toEqual(postsAndAuthors.records);
  });

  it("should yield correct path and records to queries with fragments", () => {
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

    let { path, records } = storeValues(query, {}, postsWithFragments.data, idFields);

    expect(path).toEqual(postsWithFragments.path);
    expect(records).toEqual(postsWithFragments.records);
  });

  it("should yield correct path and records to queries with arguments", () => {
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

    let { path, records } = storeValues(query, variables, authorWithArguments.data, idFields);

    expect(path).toEqual(authorWithArguments.path);
    expect(records).toEqual(authorWithArguments.records);
  });

  it("should yield correct path and records to queries with arguments and fragments", () => {
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

    let { path, records } = storeValues(query, variables, authorWithArguments.data, idFields);

    expect(path).toEqual(authorWithArguments.path);
    expect(records).toEqual(authorWithArguments.records);
  });

  it("should deal correctly with null values", () => {
    let query = graphql`
      query {
        authors {
          name
        }
      }
    `;

    let data = { authors: postsAndAuthors.data.authors };
    data.authors[0].posts = null;

    let { path } = storeValues(query, {}, data, idFields);

    expect(path).toEqual({
      authors: [
        { id: "a1d3a2bc-e503-4640-9178-23cbd36b542c", posts: null },
        {
          id: "a1d1c3f0-5bd5-453e-b4f8-9f419457e5a6",
          posts: [
            { id: "9007748e-5e37-4f3a-8da2-b2041505a867" },
            { id: "77c483dd-6529-4c72-9bb6-bbfd69f65682" },
            { id: "802e2565-3b33-4b89-9fbc-e0c8d1dbddae" },
            { id: "90b11972-305f-43f8-a6a8-ddad70d1459b" }
          ]
        }
      ]
    });
  });
});
