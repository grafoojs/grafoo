import test from "ava";

import mapObjects from "../src/map-objects";

const tree = {
  posts: [
    {
      title: "foo",
      id: "1",
      __typename: "Post",
      author: {
        name: "miguel",
        id: "2",
        __typename: "Author",
        posts: [
          {
            title: "foo",
            id: "1",
            __typename: "Post",
            content: "a post content",
            author: {
              name: "miguel",
              lastName: "albernaz",
              id: "2",
              __typename: "Author"
            }
          }
        ]
      }
    },
    {
      title: "bar",
      id: "3",
      __typename: "Post",
      author: { name: "vicente", id: "4", __typename: "Author" }
    },
    {
      title: "baz",
      id: "5",
      __typename: "Post",
      author: { name: "laura", id: "6", __typename: "Author" }
    }
  ]
};

const idFromProps = _ => _.id;

test("should return the correct map of objects", t => {
  const objects = mapObjects(tree, idFromProps);

  const expected = {
    "1": { title: "foo", id: "1", __typename: "Post", content: "a post content" },
    "2": { name: "miguel", id: "2", __typename: "Author", lastName: "albernaz" },
    "3": { title: "bar", __typename: "Post", id: "3" },
    "4": { name: "vicente", id: "4", __typename: "Author" },
    "5": { title: "baz", __typename: "Post", id: "5" },
    "6": { name: "laura", id: "6", __typename: "Author" }
  };

  t.deepEqual(objects, expected);
});

test("should accept null values", t => {
  const result = {
    data: {
      me: {
        id: "5a3ab7e93f662a108d978a6e",
        username: "malbernaz",
        email: "albernazmiguel@gmail.com",
        name: null,
        bio: null
      }
    }
  };

  t.notThrows(() => mapObjects(result, idFromProps));
});

test("should build an object identifier based on the `idFromProps` function", t => {
  const idFromProps = obj => obj.__typename + ":" + obj.id;
  const objects = mapObjects(tree, idFromProps);

  const expected = ["Post:1", "Author:2", "Post:3", "Author:4", "Post:5", "Author:6"];

  t.true(Object.keys(objects).every(obj => expected.some(exp => exp === obj)));
});
