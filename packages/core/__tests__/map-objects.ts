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
              __typename: "Author",
            },
          },
        ],
      },
    },
    {
      title: "bar",
      id: "3",
      __typename: "Post",
      author: { name: "vicente", id: "4", __typename: "Author" },
    },
    {
      title: "baz",
      id: "5",
      __typename: "Post",
      author: { name: "laura", id: "6", __typename: "Author" },
    },
  ],
};

const idFields = ["id"];

describe("map-objects", () => {
  it("should return the correct map of objects", () => {
    let objects = mapObjects(tree, idFields);

    let expected = {
      "1": { title: "foo", id: "1", __typename: "Post", content: "a post content" },
      "2": { name: "miguel", id: "2", __typename: "Author", lastName: "albernaz" },
      "3": { title: "bar", __typename: "Post", id: "3" },
      "4": { name: "vicente", id: "4", __typename: "Author" },
      "5": { title: "baz", __typename: "Post", id: "5" },
      "6": { name: "laura", id: "6", __typename: "Author" },
    };

    expect(objects).toEqual(expected);
  });

  it("should accept null values", () => {
    let result = {
      data: {
        me: {
          id: "5a3ab7e93f662a108d978a6e",
          username: "malbernaz",
          email: "albernazmiguel@gmail.com",
          name: null,
          bio: null,
        },
      },
    };

    expect(() => mapObjects(result, idFields)).not.toThrow();
  });

  it("should build an object identifier based on the `idFields` cache option", () => {
    let idFields = ["__typename", "id"];

    let objects = mapObjects(tree, idFields);

    let expected = ["Post1", "Author2", "Post3", "Author4", "Post5", "Author6"];

    expect(Object.keys(objects).every((obj) => expected.some((exp) => exp === obj))).toBe(true);
  });
});
