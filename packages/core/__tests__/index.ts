import graphql from "@grafoo/core/tag";
import { executeQuery } from "@grafoo/test-utils";
import { GrafooClient, Variables } from "@grafoo/types";
import createClient from "../src";

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

interface PostsAndAuthorsQuery {
  authors: Author[];
  posts: Post[];
}

interface PostsQuery {
  posts: Post[];
}

const AUTHORS = graphql`
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

const SIMPLE_AUTHORS = graphql`
  query {
    authors {
      name
    }
  }
`;

const POSTS_AND_AUTHORS = graphql`
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

const POST = graphql`
  query($postId: ID!) {
    post(id: $postId) {
      title
      body
      author {
        name
      }
    }
  }
`;

const POST_WITH_FRAGMENT = graphql`
  query($postId: ID!) {
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

const POSTS = graphql`
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

function mockTrasport<T>(query: string, variables: Variables) {
  return executeQuery<T>({ query, variables });
}

describe("@grafoo/core", () => {
  let client: GrafooClient;
  beforeEach(() => {
    client = createClient(mockTrasport, { idFields: ["id"] });
  });

  it("should be instantiable", () => {
    expect(() => createClient(mockTrasport, { idFields: ["id"] })).not.toThrow();
    expect(typeof client.execute).toBe("function");
    expect(typeof client.listen).toBe("function");
    expect(typeof client.write).toBe("function");
    expect(typeof client.read).toBe("function");
    expect(typeof client.flush).toBe("function");
    expect(typeof client.reset).toBe("function");
  });

  it("should perform query requests", async () => {
    const variables = { postId: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };

    let { query, frags } = POST_WITH_FRAGMENT;
    if (frags) for (const frag in frags) query += " " + frags[frag];

    const data = await executeQuery({ query, variables });

    expect(data).toEqual(await client.execute(POST_WITH_FRAGMENT, variables));
  });

  it("should perform query requests with fragments", async () => {
    const data = await executeQuery({ query: SIMPLE_AUTHORS.query });

    expect(data).toEqual(await client.execute(SIMPLE_AUTHORS));
  });

  it("should write queries to the client", async () => {
    const data = await executeQuery<PostsAndAuthorsQuery>(POSTS_AND_AUTHORS);

    client.write(POSTS_AND_AUTHORS, data);

    const { authors, posts } = data.data;
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

  it("should write queries partially to the client", async () => {
    const { data } = await executeQuery<PostsQuery>(POSTS);

    expect(() => client.write(POSTS_AND_AUTHORS, data)).not.toThrow();
    expect(() => client.read(POSTS)).not.toThrow();
    expect(() => client.read(AUTHORS)).not.toThrow();
  });

  it("should read queries from the client", async () => {
    const { data } = await executeQuery<AuthorsQuery>(AUTHORS);

    client.write(AUTHORS, data);

    const result = client.read<AuthorsQuery>(AUTHORS);

    const { authors } = data;

    expect(authors).toEqual(result.data.authors);
    expect(authors.every(author => Boolean(result.objects[author.id]))).toBe(true);
    expect(
      authors.every(author => author.posts.every(post => Boolean(result.objects[post.id])))
    ).toBe(true);
  });

  it("should handle queries with variables", async () => {
    const variables = { postId: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };
    const { data } = await executeQuery<PostQuery>({ query: POST.query, variables });

    client.write(POST, variables, data);

    expect(client.read(POST, { postId: "123" })).toEqual({});
    expect(client.read<PostQuery>(POST, variables).data.post.id).toBe(variables.postId);
  });

  it("should distinguish between calls to the same query with different variables", async () => {
    const v1 = { postId: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };
    const v2 = { postId: "77c483dd-6529-4c72-9bb6-bbfd69f65682" };

    const { data: d1 } = await executeQuery<PostQuery>({ query: POST.query, variables: v1 });
    client.write(POST, v1, d1);

    expect(client.read(POST, { postId: "not found" })).toEqual({});
    expect(client.read<PostQuery>(POST, v1).data.post.id).toBe(v1.postId);

    const d2 = await executeQuery<PostQuery>({ query: POST.query, variables: v2 });
    client.write(POST, v2, d2);

    expect(client.read<PostQuery>(POST, v1).data.post.id).toBe(v1.postId);
    expect(client.read<PostQuery>(POST, v2).data.post.id).toBe(v2.postId);
  });

  it("should flag if a query result is partial", async () => {
    const { data } = await executeQuery<PostsQuery>({ query: POSTS.query });

    client.write(POSTS, data);

    expect(client.read<PostsAndAuthorsQuery>(POSTS_AND_AUTHORS).partial).toBe(true);
  });

  it("should remove unused objects from objectsMap", async () => {
    const { data } = await executeQuery<AuthorsQuery>(SIMPLE_AUTHORS);

    client.write(SIMPLE_AUTHORS, data);

    const authorToBeRemoved: Author = data.authors[0];

    const ids = Object.keys(client.flush().objectsMap);

    expect(ids.some(id => id === authorToBeRemoved.id)).toBe(true);

    client.write(SIMPLE_AUTHORS, {
      authors: data.authors.filter(author => author.id !== authorToBeRemoved.id)
    });

    const nextIds = Object.keys(client.flush().objectsMap);

    expect(nextIds.length).toBe(ids.length - 1);
    expect(nextIds.some(id => id === authorToBeRemoved.id)).toBe(false);
  });

  it("should perform update to client", async () => {
    const variables = { postId: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };
    const { data } = await executeQuery<PostQuery>({ query: POST.query, variables });

    client.write(POST, variables, data);

    const {
      data: { post }
    } = client.read<PostQuery>(POST, variables);

    expect(post.title).toBe("Quam odit");

    client.write(POST, variables, { post: { ...post, title: "updated title" } });

    expect(client.read<PostQuery>(POST, variables).data.post.title).toBe("updated title");
  });

  it("should reflect updates on queries with shared objects", async () => {
    const variables = { postId: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };
    const postData = (await executeQuery<PostQuery>({ query: POST.query, variables })).data;
    const postsData = (await executeQuery<PostsQuery>({ query: POSTS.query, variables })).data;

    client.write(POSTS, postsData);

    const { posts } = client.read<PostsQuery>(POSTS).data;

    expect(posts.find(p => p.id === variables.postId).title).toBe("Quam odit");

    client.write(POST, variables, { post: { ...postData.post, title: "updated title" } });

    const { posts: updatedPosts } = client.read<PostsQuery>(POSTS, variables).data;

    expect(updatedPosts.find(p => p.id === variables.postId).title).toBe("updated title");
  });

  it("should merge objects in the client when removing or adding properties", async () => {
    const variables = { postId: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };
    const data = (await executeQuery<PostQuery>({ query: POST.query, variables })).data;

    client.write(POST, variables, data);

    const post = JSON.parse(JSON.stringify(client.read<PostQuery>(POST, variables).data.post));

    delete post.__typename;

    post.foo = "bar";

    client.write(POST, variables, { post });

    expect(client.read<PostQuery>(POST, variables).data.post).toEqual({
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

  it("should call client listeners on write with paths objects as arguments", async () => {
    const variables = { postId: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };
    const data = (await executeQuery<PostQuery>({ query: POST.query, variables })).data;

    const listener = jest.fn();
    const listener2 = jest.fn();

    const unlisten = client.listen(listener);
    client.listen(listener2);

    client.write(POST, variables, data);

    expect(listener).toHaveBeenCalledWith(client.read(POST, variables).objects);

    unlisten();
    client.write(POST, variables, data);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(2);

    unlisten();
    client.write(POST, variables, data);

    expect(listener2).toHaveBeenCalledTimes(3);
  });

  it("should be able read from the client with a declared initialState", async () => {
    const { data } = await executeQuery(POSTS_AND_AUTHORS);

    client.write(POSTS_AND_AUTHORS, data);

    client = createClient(mockTrasport, { idFields: ["id"], initialState: client.flush() });

    expect(client.read(POSTS_AND_AUTHORS).data).toEqual(data);
  });

  it("should be able to read from objectsMap by key", async () => {
    const variables = { postId: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };
    const { data } = await executeQuery<PostQuery>({ query: POST.query, variables });

    client.write(POST, variables, data);

    const existingKey = "2c969ce7-02ae-42b1-a94d-7d0a38804c85";
    expect(client.readByKey(existingKey)).toEqual({
      __typename: "Post",
      body: "Ducimus harum delectus consectetur.",
      id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85",
      title: "Quam odit"
    });

    const nonExistentKey = "id-that-doesnt-exist-in-cache";
    expect(client.readByKey(nonExistentKey)).toEqual(undefined);
  });

  it("should allow cache to be cleared using reset()", () => {
    const data = { authors: [{ name: "deleteme" }] };
    client.write(SIMPLE_AUTHORS, data);
    expect(client.read(SIMPLE_AUTHORS).data).toEqual(data);
    client.reset();
    expect(client.read(SIMPLE_AUTHORS).data).toEqual(undefined);
    expect(client.flush()).toEqual({
      objectsMap: {},
      pathsMap: {}
    });
  });

  it("should accept `idFields` array in options", async () => {
    const { data } = await executeQuery(AUTHORS);

    const client = createClient(mockTrasport, { idFields: ["__typename", "id"] });

    client.write(AUTHORS, data);

    const cachedIds = Object.keys(client.flush().objectsMap);

    expect(cachedIds.every(key => /(Post|Author)/.test(key))).toBe(true);
  });
});
