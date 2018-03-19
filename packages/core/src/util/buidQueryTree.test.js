import expect from "expect";

import { buildQueryTree } from ".";

let tree = {
  posts: [
    {
      title: "foo",
      id: "1",
      author: {
        name: "miguel",
        id: "2",
        posts: [
          {
            title: "foo",
            id: "1",
            content: "nice post",
            author: {
              name: "miguel",
              lastName: "albernaz",
              id: "2"
            }
          }
        ]
      }
    },
    { title: "bar", id: "3", author: { name: "vicente", id: "4" } },
    { title: "baz", id: "5", author: { name: "laura", id: "6" } }
  ]
};

let objects = {
  "1": { title: "foo", id: "1", content: "nice post" },
  "2": { name: "miguel", id: "2", lastName: "albernaz" },
  "3": { title: "bar", id: "3" },
  "4": { name: "vicente", id: "4" },
  "5": { title: "baz", id: "5" },
  "6": { name: "laura", id: "6" }
};

describe("buildQueryTree", () => {
  let map = buildQueryTree(tree, objects);

  it("should produce a resulting query tree", () => {
    expect(map).toEqual(tree);
  });

  it("should update values of a resulting query tree", () => {
    let objects = {
      "1": { title: "not foo", id: "1", content: "nice post" },
      "2": { name: "miguel", id: "2", lastName: "albernaz" },
      "3": { title: "bar", id: "3" },
      "4": { name: "vicente", id: "4" },
      "5": { title: "baz", id: "5" },
      "6": { name: "laura", id: "6" }
    };

    let expected = {
      posts: [
        {
          author: {
            id: "2",
            name: "miguel",
            posts: [
              {
                author: { id: "2", lastName: "albernaz", name: "miguel" },
                content: "nice post",
                id: "1",
                title: "not foo"
              }
            ]
          },
          id: "1",
          title: "not foo"
        },
        { author: { id: "4", name: "vicente" }, id: "3", title: "bar" },
        { author: { id: "6", name: "laura" }, id: "5", title: "baz" }
      ]
    };

    expect(buildQueryTree(tree, objects)).toEqual(expected);
  });
});
