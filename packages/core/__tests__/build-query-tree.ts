import buildQueryTree from "../src/build-query-tree";

let tree = {
  posts: [
    {
      title: "foo",
      id: "1",
      author: {
        name: "homer",
        id: "2",
        posts: [
          {
            id: "1",
            content: "a post content",
            author: {
              name: "homer",
              lastName: "albernaz",
              id: "2"
            }
          }
        ]
      }
    },
    { title: "bar", id: "3", author: { name: "bart", id: "4" } },
    { title: "baz", id: "5", author: { name: "lisa", id: "6" } }
  ]
};

let idFields = ["id"];

describe("build-query-tree", () => {
  it("should update values of a resulting query tree", () => {
    let records = {
      "1": { title: "foobar", id: "1", content: "a new post content" },
      "2": { name: "homer", id: "2", lastName: "simpson" }
    };

    let { posts } = buildQueryTree(tree, records, idFields);

    expect(posts[0].title).toBe("foobar");
    // @ts-ignore
    expect(posts[0].content).toBe("a new post content");
    // @ts-ignore
    expect(posts[0].author.lastName).toBe("simpson");
  });

  it("should add all properties of an object to its corresponding branch", () => {
    let records = {
      "1": { title: "foo", id: "1", content: "a post content" },
      "2": { name: "homer", id: "2", lastName: "simpson" }
    };

    let [post] = buildQueryTree(tree, records, idFields).posts;

    // @ts-ignore
    expect(post.content).toBeTruthy();
    // @ts-ignore
    expect(post.author.lastName).toBeTruthy();
    // @ts-ignore
    expect(post.author.posts[0].title).toBeTruthy();
  });

  it("should not remove a property from a branch", () => {
    let records = {
      "1": { id: "1" },
      "2": { id: "2" },
      "3": { id: "3" },
      "4": { id: "4" },
      "5": { id: "5" },
      "6": { id: "6" }
    };

    let newTree = buildQueryTree(tree, records, idFields);

    expect(newTree).toEqual(tree);
  });
});
