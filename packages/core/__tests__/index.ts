import graphql from "@grafoo/core/tag";
import { executeQuery, Query, QueryPostArgs } from "@grafoo/test-utils";
import createClient from "../src";
import { GrafooClient } from "../src/types";

type AuthorsQuery = Pick<Query, "authors">;

let AUTHORS = graphql<AuthorsQuery>`
  query {
    authors {
      edges {
        node {
          name
          posts {
            edges {
              node {
                body
                title
              }
            }
          }
        }
      }
    }
  }
`;

let SIMPLE_AUTHORS = graphql<AuthorsQuery>`
  query {
    authors {
      edges {
        node {
          name
        }
      }
    }
  }
`;

type PostsAndAuthorsQuery = Pick<Query, "authors" | "posts">;

let POSTS_AND_AUTHORS = graphql<PostsAndAuthorsQuery>`
  query {
    posts {
      edges {
        node {
          title
          body
          author {
            name
          }
        }
      }
    }

    authors {
      edges {
        node {
          name
          posts {
            edges {
              node {
                body
                title
              }
            }
          }
        }
      }
    }
  }
`;

type PostQuery = Pick<Query, "post">;

let POST = graphql<PostQuery, QueryPostArgs>`
  query ($id: ID!) {
    post(id: $id) {
      title
      body
      author {
        name
      }
    }
  }
`;

let POST_WITH_FRAGMENT = graphql<PostQuery, QueryPostArgs>`
  query ($id: ID!) {
    post(id: $id) {
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

type PostsQuery = Pick<Query, "posts">;

let POSTS = graphql<PostsQuery>`
  query {
    posts {
      edges {
        node {
          title
          body
          author {
            name
          }
        }
      }
    }
  }
`;

function mockTransport<T>(query: any, variables: any) {
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
    expect(typeof client.extract).toBe("function");
    expect(typeof client.reset).toBe("function");
  });

  it("should perform query requests", async () => {
    let data = await client.execute(SIMPLE_AUTHORS);
    expect(data).toEqual(await client.execute(SIMPLE_AUTHORS));
  });

  it("should perform query requests with fragments", async () => {
    let variables = { id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };

    let data = await executeQuery({ query: POST_WITH_FRAGMENT.document, variables });

    expect(data).toEqual(await client.execute(POST_WITH_FRAGMENT, variables));
  });

  it("should write queries to the client", async () => {
    let { data } = await client.execute(POSTS_AND_AUTHORS);

    client.write(POSTS_AND_AUTHORS, data);

    let { authors, posts } = data;
    let { records } = client.extract();

    expect(authors.edges.every((a) => Boolean(records[a.node.id]))).toBe(true);
    expect(posts.edges.every((p) => Boolean(records[p.node.id]))).toBe(true);
  });

  it("should write queries partially to the client", async () => {
    let { data } = await client.execute(POSTS);

    client.write(POSTS_AND_AUTHORS, data as any);

    expect(client.read(POSTS)).toMatchObject({ data, partial: false });
    expect(client.read(AUTHORS)).toEqual({ data: {}, records: {}, partial: true });
  });

  it("should read queries from the client", async () => {
    let { data } = await client.execute(AUTHORS);

    client.write(AUTHORS, data);

    let result = client.read(AUTHORS);

    let { authors } = data;

    expect(authors).toEqual(result.data.authors);
    expect(authors.edges.every((a) => Boolean(result.records[a.node.id]))).toBe(true);
    expect(
      authors.edges.every((a) => a.node.posts.edges.every((p) => !!result.records[p.node.id]))
    ).toBe(true);
  });

  it("should handle queries with variables", async () => {
    let variables = { id: "UG9zdDo5YzZhYmQ1OC0wY2M1LTQzNDEtODdhMi1lZGUzNjQ2ODVlYmQ=" };
    let { data } = await client.execute(POST, variables);

    client.write(POST, variables, data);

    expect(client.read(POST, { id: "123" }).data).toEqual({});
    expect(client.read(POST, variables).data.post.id).toBe(variables.id);
  });

  it("should distinguish between calls to the same query with different variables", async () => {
    let v1 = { id: "UG9zdDo5YzZhYmQ1OC0wY2M1LTQzNDEtODdhMi1lZGUzNjQ2ODVlYmQ=" };
    let v2 = { id: "UG9zdDoyYzk2OWNlNy0wMmFlLTQyYjEtYTk0ZC03ZDBhMzg4MDRjODU=" };

    let d1 = await client.execute(POST, v1);
    client.write(POST, v1, d1.data);

    expect(client.read(POST, v1).data.post.id).toBe(v1.id);

    let d2 = await client.execute(POST, v2);
    client.write(POST, v2, d2.data);

    expect(client.read(POST, v1).data.post.id).toBe(v1.id);
    expect(client.read(POST, v2).data.post.id).toBe(v2.id);
  });

  it("should flag if a query result is partial", async () => {
    let { data } = await client.execute(POSTS);

    client.write(POSTS, data);

    expect(client.read(POSTS_AND_AUTHORS).partial).toBe(true);
  });

  it("should perform update to client", async () => {
    let variables = { id: "UG9zdDoyYzk2OWNlNy0wMmFlLTQyYjEtYTk0ZC03ZDBhMzg4MDRjODU=" };
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
    let variables = { id: "UG9zdDoyYzk2OWNlNy0wMmFlLTQyYjEtYTk0ZC03ZDBhMzg4MDRjODU=" };
    let postData = await client.execute(POST, variables);
    let postsData = await client.execute(POSTS, variables);

    client.write(POSTS, postsData.data);

    let { posts } = client.read(POSTS).data;

    expect(posts.edges.find((p) => p.node.id === variables.id).node.title).toBe("Quam odit");

    client.write(POST, variables, {
      post: { ...postData.data.post, title: "updated title" }
    });

    let { posts: updatedPosts } = client.read(POSTS, variables).data;

    expect(updatedPosts.edges.find((p) => p.node.id === variables.id).node.title).toBe(
      "updated title"
    );
  });

  it("should merge records in the client when removing or adding properties", async () => {
    let variables = { id: "UG9zdDoyYzk2OWNlNy0wMmFlLTQyYjEtYTk0ZC03ZDBhMzg4MDRjODU=" };
    let { data } = await client.execute(POST, variables);

    client.write(POST, variables, data);

    let post = JSON.parse(JSON.stringify(client.read(POST, variables).data.post));

    post.title = "updated title";

    client.write(POST, variables, { post });

    expect(client.read(POST, variables).data.post).toEqual({
      ...data.post,
      title: "updated title"
    });
  });

  it("should call client listeners on write with paths records as arguments", async () => {
    let variables = { id: "UG9zdDoyYzk2OWNlNy0wMmFlLTQyYjEtYTk0ZC03ZDBhMzg4MDRjODU=" };
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

    client = createClient(mockTransport, { idFields: ["id"], initialState: client.extract() });

    expect(client.read(POSTS_AND_AUTHORS).data).toEqual(data);
  });

  it("should clear cache if reset is called", async () => {
    let { data } = await client.execute(AUTHORS);
    client.write(AUTHORS, data);
    expect(client.read(AUTHORS).data).toEqual(data);
    client.reset();
    expect(client.extract()).toEqual({ records: {}, paths: {} });
  });

  it("should accept `idFields` array in options", async () => {
    let client = createClient(mockTransport, { idFields: ["__typename", "id"] });
    let { data } = await client.execute(AUTHORS);

    client.write(AUTHORS, data);

    let cachedIds = Object.keys(client.extract().records);

    expect(cachedIds.every((key) => /(Post|Author)/.test(key))).toBe(true);
  });
});
