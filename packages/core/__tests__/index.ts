import graphql from "@grafoo/core/tag";
import { executeQuery } from "@grafoo/test-utils";
import createClient, { GrafooClient } from "../src";

type Post = {
  title?: string;
  content?: string;
  id?: string;
  __typename?: string;
  author?: Author;
};

type Author = {
  name?: string;
  id?: string;
  __typename?: string;
  posts?: Array<Post>;
};

type AuthorsQuery = {
  authors: Author[];
};

let AUTHORS = graphql<AuthorsQuery>`
  query {
    authors {
      name
      posts {
        title
        body
      }
    }
  }
`;

let SIMPLE_AUTHORS = graphql<AuthorsQuery>`
  query {
    authors {
      name
    }
  }
`;

type PostsAndAuthorsQuery = {
  authors: Author[];
  posts: Post[];
};

let POSTS_AND_AUTHORS = graphql<PostsAndAuthorsQuery>`
  query {
    posts {
      title
      body
      author {
        name
      }
    }

    authors {
      name
      posts {
        title
        body
      }
    }
  }
`;

type PostQuery = {
  post: Post;
};

type PostQueryArgs = {
  postId: string;
};

let POST = graphql<PostQuery, PostQueryArgs>`
  query ($postId: ID!) {
    post(id: $postId) {
      title
      body
      author {
        name
      }
    }
  }
`;

let POST_WITH_FRAGMENT = graphql<PostQuery, PostQueryArgs>`
  query ($postId: ID!) {
    post(id: $postId) {
      title
      body
      author {
        ...AuthorInfo
      }
    }
  }

  fragment AuthorInfo on Author {
    name
  }
`;

type PostsQuery = {
  posts: Post[];
};

let POSTS = graphql<PostsQuery>`
  query {
    posts {
      title
      body
      author {
        name
      }
    }
  }
`;

function mockTransport<T>(query, variables) {
  return executeQuery<T>({ query, variables });
}

describe("@grafoo/core", () => {
  let client: GrafooClient;
  beforeEach(() => {
    client = createClient(mockTransport, { idFields: ["id"] });
  });

  it("should be instantiable", () => {
    expect(() => createClient(mockTransport, { idFields: ["id"] })).not.toThrow();
    expect(typeof client.execute).toBe("function");
    expect(typeof client.listen).toBe("function");
    expect(typeof client.write).toBe("function");
    expect(typeof client.read).toBe("function");
    expect(typeof client.flush).toBe("function");
    expect(typeof client.reset).toBe("function");
  });

  it("should perform query requests", async () => {
    let data = await client.execute(SIMPLE_AUTHORS);
    expect(data).toEqual(await client.execute(SIMPLE_AUTHORS));
  });

  it("should perform query requests with fragments", async () => {
    let variables = { postId: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };
    let { query, frags } = POST_WITH_FRAGMENT;

    if (frags) for (let frag in frags) query += " " + frags[frag];

    let data = await executeQuery({ query, variables });

    expect(data).toEqual(await client.execute(POST_WITH_FRAGMENT, variables));
  });

  it("should write queries to the client", async () => {
    let { data } = await client.execute(POSTS_AND_AUTHORS);

    client.write(POSTS_AND_AUTHORS, data);

    let { authors, posts } = data;
    let { records, paths } = client.flush();

    expect(authors).toEqual(
      paths["authors{__typename id name posts{__typename body id title}}"].data.authors
    );
    expect(posts).toEqual(
      paths["posts{__typename author{__typename id name}body id title}"].data.posts
    );
    expect(authors.every((author) => Boolean(records[author.id]))).toBe(true);
    expect(posts.every((post) => Boolean(records[post.id]))).toBe(true);
  });

  it("should write queries partially to the client", async () => {
    let data = await client.execute(POSTS);

    expect(() => client.write(POSTS_AND_AUTHORS, data as any)).not.toThrow();
    expect(() => client.read(POSTS)).not.toThrow();
    expect(() => client.read(AUTHORS)).not.toThrow();
  });

  it("should read queries from the client", async () => {
    let { data } = await client.execute(AUTHORS);

    client.write(AUTHORS, data);

    let result = client.read(AUTHORS);

    let { authors } = data;

    expect(authors).toEqual(result.data.authors);
    expect(authors.every((author) => Boolean(result.records[author.id]))).toBe(true);
    expect(
      authors.every((author) => author.posts.every((post) => Boolean(result.records[post.id])))
    ).toBe(true);
  });

  it("should handle queries with variables", async () => {
    let variables = { postId: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };
    let { data } = await client.execute(POST, variables);

    client.write(POST, variables, data);

    expect(client.read(POST, { postId: "123" })).toEqual({});
    expect(client.read(POST, variables).data.post.id).toBe(variables.postId);
  });

  it("should distinguish between calls to the same query with different variables", async () => {
    let v1 = { postId: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };
    let v2 = { postId: "77c483dd-6529-4c72-9bb6-bbfd69f65682" };

    let d1 = await client.execute(POST, v1);
    client.write(POST, v1, d1.data);

    expect(client.read(POST, { postId: "not found" })).toEqual({});
    expect(client.read(POST, v1).data.post.id).toBe(v1.postId);

    let d2 = await client.execute(POST, v2);
    client.write(POST, v2, d2.data);

    expect(client.read(POST, v1).data.post.id).toBe(v1.postId);
    expect(client.read(POST, v2).data.post.id).toBe(v2.postId);
  });

  it("should flag if a query result is partial", async () => {
    let { data } = await client.execute(POSTS);

    client.write(POSTS, data);

    expect(client.read(POSTS_AND_AUTHORS).partial).toBe(true);
  });

  it("should remove unused records from state records", async () => {
    let { data } = await client.execute(SIMPLE_AUTHORS);

    client.write(SIMPLE_AUTHORS, data);

    let authorToBeRemoved = data.authors[0];

    let ids = Object.keys(client.flush().records);

    expect(ids.some((id) => id === authorToBeRemoved.id)).toBe(true);

    client.write(SIMPLE_AUTHORS, {
      authors: data.authors.filter((author) => author.id !== authorToBeRemoved.id)
    });

    let nextIds = Object.keys(client.flush().records);

    expect(nextIds.length).toBe(ids.length - 1);
    expect(nextIds.some((id) => id === authorToBeRemoved.id)).toBe(false);
  });

  it("should perform update to client", async () => {
    let variables = { postId: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };
    let { data } = await client.execute(POST, variables);

    client.write(POST, variables, data);

    let {
      data: { post }
    } = client.read(POST, variables);

    expect(post.title).toBe("Quam odit");

    client.write(POST, variables, { post: { ...post, title: "updated title" } });
    expect(client.read(POST, variables).data.post.title).toBe("updated title");
  });

  it("should reflect updates on queries when shared records change", async () => {
    let variables = { postId: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };
    let postData = await client.execute(POST, variables);
    let postsData = await client.execute(POSTS, variables);

    client.write(POSTS, postsData.data);

    let { posts } = client.read(POSTS).data;

    expect(posts.find((p) => p.id === variables.postId).title).toBe("Quam odit");

    client.write(POST, variables, {
      post: { ...postData.data.post, title: "updated title" }
    });

    let { posts: updatedPosts } = client.read(POSTS, variables).data;

    expect(updatedPosts.find((p) => p.id === variables.postId).title).toBe("updated title");
  });

  it("should merge records in the client when removing or adding properties", async () => {
    let variables = { postId: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };
    let { data } = await client.execute(POST, variables);

    client.write(POST, variables, data);

    let post = JSON.parse(JSON.stringify(client.read(POST, variables).data.post));

    delete post.__typename;

    post.foo = "bar";

    client.write(POST, variables, { post });

    expect(client.read(POST, variables).data.post).toEqual({
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

  it("should call client listeners on write with paths records as arguments", async () => {
    let variables = { postId: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };
    let { data } = await client.execute(POST, variables);

    let listener = jest.fn();
    let listener2 = jest.fn();

    let unlisten = client.listen(listener);
    client.listen(listener2);

    client.write(POST, variables, data);

    expect(listener).toHaveBeenCalledWith(client.read(POST, variables).records);

    unlisten();
    client.write(POST, variables, data);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(2);

    unlisten();
    client.write(POST, variables, data);

    expect(listener2).toHaveBeenCalledTimes(3);
  });

  it("should be able read from the client with a declared initialState", async () => {
    let { data } = await client.execute(POSTS_AND_AUTHORS);

    client.write(POSTS_AND_AUTHORS, data);

    client = createClient(mockTransport, { idFields: ["id"], initialState: client.flush() });

    expect(client.read(POSTS_AND_AUTHORS).data).toEqual(data);
  });

  it("should allow cache to be cleared using reset()", () => {
    let data: AuthorsQuery = { authors: [{ name: "deleteme" }] };
    client.write(SIMPLE_AUTHORS, data);
    expect(client.read(SIMPLE_AUTHORS).data).toEqual(data);
    client.reset();
    expect(client.read(SIMPLE_AUTHORS).data).toEqual(undefined);
    expect(client.flush()).toEqual({ records: {}, paths: {} });
  });

  it("should accept `idFields` array in options", async () => {
    let client = createClient(mockTransport, { idFields: ["__typename", "id"] });
    let { data } = await client.execute(AUTHORS);

    client.write(AUTHORS, data);

    let cachedIds = Object.keys(client.flush().records);

    expect(cachedIds.every((key) => /(Post|Author)/.test(key))).toBe(true);
  });
});
