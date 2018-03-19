import expect from "expect";

import { mergeObjects } from ".";

const objects = {
  "1": { title: "foo", id: "1" },
  "2": { name: "miguel", id: "2" },
  "3": { title: "bar", id: "3" },
  "4": { name: "vicente", id: "4" },
  "5": { title: "baz", id: "5" },
  "6": { name: "laura", id: "6" }
};

const newObjects = {
  "1": { title: "foo", id: "1", content: "nice post" },
  "2": { name: "miguel", id: "2", lastName: "albernaz" }
};

describe("mergeObjects", () => {
  const map = mergeObjects(objects, newObjects);

  it("should merge two objects", () => {
    const expected = {
      "1": { title: "foo", id: "1", content: "nice post" },
      "2": { name: "miguel", id: "2", lastName: "albernaz" },
      "3": { title: "bar", id: "3" },
      "4": { name: "vicente", id: "4" },
      "5": { title: "baz", id: "5" },
      "6": { name: "laura", id: "6" }
    };

    expect(expected).toEqual(map);
  });
});
