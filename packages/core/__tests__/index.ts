import {
  Authors,
  Post,
  Posts,
  PostsAndAuthors,
  executeQuery,
  mockQueryRequest
} from "@grafoo/test-utils";
import createClient from "../src";
import { ClientInstance } from "@grafoo/types";

interface Post {
  title: string;
  content: string;
  id: string;
  __typename: string;
  author: Author;
}

interface Author {
  name: string;
  id: string;
  __typename: string;
  posts?: Array<Post>;
}

interface AuthorsQuery {
  authors: Author[];
}

interface PostQuery {
  post: Post;
}

interface PostsQuery {
  posts: Post[];
}

describe("@grafoo/core", () => {
  let client: ClientInstance;
  beforeEach(() => {
    client = createClient("", { idFields: ["id"] });
  });

  it("should be instantiable", () => {
    const client = createClient("", { idFields: ["id"] });

    expect(typeof client.request).toBe("function");
    expect(typeof client.listen).toBe("function");
    expect(typeof client.write).toBe("function");
    expect(typeof client.read).toBe("function");
    expect(typeof client.flush).toBe("function");
  });

  it("should perform query requests", async () => {
    const { data } = await mockQueryRequest({
      ...Post,
      variables: { id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" }
    });

    expect(data).toEqual(
      await client.request(Post, { id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" })
    );
  });

  it("should write queries to the client", async () => {
    await mock(PostsAndAuthors, async (data, { query, variables }) => {
      client.write(query, variables, data);

      const { authors, posts } = data;
      const { objectsMap, pathsMap } = client.flush();

      expect(authors).toEqual(
        pathsMap["authors{__typename id name posts{__typename body id title}}"].data.authors
      );
      expect(posts).toEqual(
        pathsMap["posts{__typename author{__typename id name}body id title}"].data.posts
      );
      expect(authors.every(author => Boolean(objectsMap[author.id]))).toBe(true);
      expect(posts.every(post => Boolean(objectsMap[post.id]))).toBe(true);
    });
  });

  it("should read queries from the client", async () => {
    await mock(Authors, async (data, { query, variables }) => {
      client.write(query, variables, data);

      const result = client.read<AuthorsQuery>(query, variables);

      const { authors } = data;

      expect(authors).toEqual(result.data.authors);
      expect(authors.every(author => Boolean(result.objects[author.id]))).toBe(true);
      expect(
        authors.every(author => author.posts.every(post => Boolean(result.objects[post.id])))
      ).toBe(true);
    });
  });

  it("should handle queries with variables", async () => {
    await mock(Post, async (data, { query, variables }) => {
      client.write(query, variables, data);

      expect(client.read(Post, { id: "123" })).toEqual({});
      expect(client.read<PostQuery>(query, variables).data.post.id).toBe(variables.id);
    });
  });

  it("should perform update to client", async () => {
    await mock(Post, async (data, { query, variables }) => {
      client.write(query, variables, data);

      const {
        data: { post }
      } = client.read<PostQuery>(query, variables);

      expect(post.title).toBe("Quam odit");

      client.write(query, variables, { post: { ...post, title: "updated title" } });

      expect(client.read<PostQuery>(query, variables).data.post.title).toBe("updated title");
    });
  });

  it("should reflect updates on queries with shared objects", async () => {
    await mock([Posts, Post], async ([postsData, postData], [postsRequest, postRequest]) => {
      client.write(postsRequest.query, postsRequest.variables, postsData);

      const { posts } = client.read<PostsQuery>(postsRequest.query, postsRequest.variables).data;

      expect(posts.find(p => p.id === postsRequest.variables.id).title).toBe("Quam odit");

      client.write(postRequest.query, postRequest.variables, {
        post: { ...postData.post, title: "updated title" }
      });

      const { posts: updatedPosts } = client.read<PostsQuery>(
        postsRequest.query,
        postsRequest.variables
      ).data;

      expect(updatedPosts.find(p => p.id === postsRequest.variables.id).title).toBe(
        "updated title"
      );
    });
  });

  it("should merge objects in the client when removing or adding properties", async () => {
    await mock(Post, async (data, { query, variables }) => {
      client.write(query, variables, data);

      const post = JSON.parse(JSON.stringify(client.read<PostQuery>(query, variables).data.post));

      delete post.__typename;

      post.foo = "bar";

      client.write(query, variables, { post });

      expect(client.read<PostQuery>(query, variables).data.post).toEqual({
        __typename: "Post",
        author: {
          __typename: "Author",
          id: "a1d3a2bc-e503-4640-9178-23cbd36b542c",
          name: "Murphy Abshire"
        },
        body: "Ducimus harum delectus consectetur.",
        id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85",
        title: "Quam odit",
        foo: "bar"
      });
    });
  });

  it("should call client listeners on write with paths objects as arguments", async () => {
    await mock(Post, async (data, { query, variables }) => {
      const listener = jest.fn();
      const listener2 = jest.fn();

      const unlisten = client.listen(listener);
      client.listen(listener2);

      client.write(query, variables, data);

      expect(listener).toHaveBeenCalledWith(client.read(query, variables).objects);

      unlisten();
      client.write(query, variables, data);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(2);

      unlisten();
      client.write(query, variables, data);

      expect(listener2).toHaveBeenCalledTimes(3);
    });
  });

  it("should be able read from the client with a declared initialState", async () => {
    await mock(Authors, async (data, { query, variables }) => {
      client.write(query, variables, data);

      client = createClient("", { idFields: ["id"], initialState: client.flush() });

      expect(client.read(query, variables).data).toEqual(data);
    });
  });

  it("should accept `idFields` array in options", async () => {
    await mock(Authors, async (data, { query, variables }) => {
      const client = createClient("", { idFields: ["__typename", "id"] });

      client.write(query, variables, data);

      expect(Object.keys(client.flush().objectsMap).every(key => /(Post|Author)/.test(key))).toBe(
        true
      );
    });
  });
});

async function mock(sources, variables, fn?) {
  if (!fn) {
    fn = variables;
    // default post id
    variables = { id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };
  }

  let { query } = sources;

  let results, requests;
  if (Array.isArray(sources)) {
    requests = sources.map(query => ({ query, variables }));
    results = (await Promise.all(
      sources.map(({ query }) => executeQuery({ query, variables }))
    )).map(_ => _.data);
  } else {
    requests = { query: sources, variables };
    results = (await executeQuery({ query, variables })).data;
  }

  await fn(results, requests);
}
