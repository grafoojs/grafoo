import test from "ava";

import { mergeObjects } from "../src/util";

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

const map = mergeObjects(objects, newObjects);

test("should merge two objects", t => {
  const expected = {
    "1": { title: "foo", id: "1", content: "nice post" },
    "2": { name: "miguel", id: "2", lastName: "albernaz" },
    "3": { title: "bar", id: "3" },
    "4": { name: "vicente", id: "4" },
    "5": { title: "baz", id: "5" },
    "6": { name: "laura", id: "6" }
  };

  t.deepEqual(expected, map);
});
