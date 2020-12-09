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
              id: "2",
            },
          },
        ],
      },
    },
    { title: "bar", id: "3", author: { name: "vicente", id: "4" } },
    { title: "baz", id: "5", author: { name: "laura", id: "6" } },
  ],
};

const idFields = ["id"];

describe("build-query-tree", () => {
  it("should update values of a resulting query tree", () => {
    const objects = {
      "1": { title: "foobar", id: "1", content: "a new post content" },
      "2": { name: "miguel", id: "2", lastName: "coelho" },
    };

    const { posts } = buildQueryTree(tree, objects, idFields);

    expect(posts[0].title).toBe("foobar");
    expect(posts[0].content).toBe("a new post content");
    expect(posts[0].author.lastName).toBe("coelho");
  });

  it("should add all properties of an object to its corresponding branch", () => {
    const objects = {
      "1": { title: "foo", id: "1", content: "a post content" },
      "2": { name: "miguel", id: "2", lastName: "coelho" },
    };

    const [post] = buildQueryTree(tree, objects, idFields).posts;

    expect(post.content).toBeTruthy();
    expect(post.author.lastName).toBeTruthy();
    expect(post.author.posts[0].title).toBeTruthy();
  });

  it("should not remove a property from a branch", () => {
    const objects = {
      "1": { id: "1" },
      "2": { id: "2" },
      "3": { id: "3" },
      "4": { id: "4" },
      "5": { id: "5" },
      "6": { id: "6" },
    };

    const newTree = buildQueryTree(tree, objects, idFields);

    expect(newTree).toEqual(tree);
  });
});
