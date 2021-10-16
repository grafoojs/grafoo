import mapRecords from "../src/map-records";

let tree = {
  posts: [
    {
      title: "foo",
      id: "1",
      __typename: "Post",
      author: {
        name: "homer",
        id: "2",
        __typename: "Author",
        posts: [
          {
            title: "foo",
            id: "1",
            __typename: "Post",
            content: "a post content",
            author: {
              name: "homer",
              lastName: "simpson",
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
      author: { name: "bart", id: "4", __typename: "Author" }
    },
    {
      title: "baz",
      id: "5",
      __typename: "Post",
      author: { name: "lisa", id: "6", __typename: "Author" }
    }
  ]
};

let idFields = ["id"];

describe("map-objects", () => {
  it("should return the correct map of records", () => {
    let records = mapRecords(tree, idFields);

    let expected = {
      "1": { title: "foo", id: "1", __typename: "Post", content: "a post content" },
      "2": { name: "homer", id: "2", __typename: "Author", lastName: "simpson" },
      "3": { title: "bar", __typename: "Post", id: "3" },
      "4": { name: "bart", id: "4", __typename: "Author" },
      "5": { title: "baz", __typename: "Post", id: "5" },
      "6": { name: "lisa", id: "6", __typename: "Author" }
    };

    expect(records).toEqual(expected);
  });

  it("should accept null values", () => {
    let result = {
      data: {
        me: {
          id: "5a3ab7e93f662a108d978a6e",
          username: "hsimpson",
          email: "simpsonhomer@gmail.com",
          name: null,
          bio: null
        }
      }
    };

    expect(() => mapRecords(result, idFields)).not.toThrow();
  });

  it("should build an object identifier based on the `idFields` cache option", () => {
    let idFields = ["__typename", "id"];

    let records = mapRecords(tree, idFields);

    let expected = ["Post:1", "Author:2", "Post:3", "Author:4", "Post:5", "Author:6"];

    expect(Object.keys(records).every((obj) => expected.some((exp) => exp === obj))).toBe(true);
  });
});
