import test from "ava";

import buildQueryTree from "../src/build-query-tree";

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
            id: "1",
            content: "a post content",
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

const idFromProps = _ => _.id;

test("should update values of a resulting query tree", t => {
  const objects = {
    "1": { title: "foobar", id: "1", content: "a new post content" },
    "2": { name: "miguel", id: "2", lastName: "coelho" }
  };

  const { posts } = buildQueryTree(tree, objects, idFromProps);

  t.is(posts[0].title, "foobar");
  t.is(posts[0].content, "a new post content");
  t.is(posts[0].author.lastName, "coelho");
});

test("should add all properties of an object to its corresponding branch", t => {
  const objects = {
    "1": { title: "foo", id: "1", content: "a post content" },
    "2": { name: "miguel", id: "2", lastName: "coelho" }
  };

  const [post] = buildQueryTree(tree, objects, idFromProps).posts;

  t.truthy(post.content);
  t.truthy(post.author.lastName);
  t.truthy(post.author.posts[0].title);
});

test("should not remove a property from a branch", t => {
  const objects = {
    "1": { id: "1" },
    "2": { id: "2" },
    "3": { id: "3" },
    "4": { id: "4" },
    "5": { id: "5" },
    "6": { id: "6" }
  };

  const newTree = buildQueryTree(tree, objects, idFromProps);

  t.deepEqual(newTree, tree);
});
