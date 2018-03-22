import test from "ava";

import { buildQueryTree } from ".";

const tree = {
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

const objects = {
  "1": { title: "foo", id: "1", content: "nice post" },
  "2": { name: "miguel", id: "2", lastName: "albernaz" },
  "3": { title: "bar", id: "3" },
  "4": { name: "vicente", id: "4" },
  "5": { title: "baz", id: "5" },
  "6": { name: "laura", id: "6" }
};

const map = buildQueryTree(tree, objects);

test("should produce a resulting query tree", t => {
  t.deepEqual(map, tree);
});

test("should update values of a resulting query tree", t => {
  const objects = {
    "1": { title: "not foo", id: "1", content: "nice post" },
    "2": { name: "miguel", id: "2", lastName: "albernaz" },
    "3": { title: "bar", id: "3" },
    "4": { name: "vicente", id: "4" },
    "5": { title: "baz", id: "5" },
    "6": { name: "laura", id: "6" }
  };

  const expected = {
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

  t.deepEqual(buildQueryTree(tree, objects), expected);
});
