import expect from "expect";

import { mapObjects } from ".";

const data = {
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

describe("mapObjects", () => {
  const map = mapObjects(data);

  it("should return a map of objects", () => {
    const expected = {
      "1": { title: "foo", id: "1", content: "nice post" },
      "2": { name: "miguel", id: "2", lastName: "albernaz" },
      "3": { title: "bar", id: "3" },
      "4": { name: "vicente", id: "4" },
      "5": { title: "baz", id: "5" },
      "6": { name: "laura", id: "6" }
    };

    expect(map).toEqual(expected);
  });

  it("should accept null values", () => {
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

    expect(() => mapObjects(result)).not.toThrow();
  });
});
