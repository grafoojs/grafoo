import sinon from "sinon";

import { executeQuery, PostsAndAuthors, Authors, Post, Posts } from "@grafoo/test-utils";

import createCache from "../src";

test("should be instantiable", () => {
  const cache = createCache();

  expect(typeof cache.listen).toBe("function");
  expect(typeof cache.write).toBe("function");
  expect(typeof cache.read).toBe("function");
  expect(typeof cache.flush).toBe("function");
});

test("should write queries to the cache", async () => {
  await mock(PostsAndAuthors, async (cache, data, request) => {
    cache.write(request, data);

    const { authors, posts } = data;
    const { objectsMap, pathsMap } = cache.flush();

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

test("should read queries from the cache", async () => {
  await mock(Authors, async (cache, data, request) => {
    cache.write(request, data);

    const result = cache.read(request);

    const { authors } = data;

    expect(authors).toEqual(result.data.authors);
    expect(authors.every(author => Boolean(result.objects[author.id]))).toBe(true);
    expect(
      authors.every(author => author.posts.every(post => Boolean(result.objects[post.id])))
    ).toBe(true);
  });
});

test("should handle queries with variables", async () => {
  await mock(Post, async (cache, data, request) => {
    cache.write(request, data);

    expect(cache.read({ query: Post, variables: { id: "123" } })).toBe(null);
    expect(cache.read(request).data.post.id).toBe(request.variables.id);
  });
});

test("should perform update to cache", async () => {
  await mock(Post, async (cache, data, request) => {
    cache.write(request, data);

    const {
      data: { post }
    } = cache.read(request);

    expect(post.title).toBe("Quam odit");

    cache.write(request, { post: { ...post, title: "updated title" } });

    expect(cache.read(request).data.post.title).toBe("updated title");
  });
});

test("should reflect updates on queries with shared objects", async () => {
  await mock([Posts, Post], async (cache, [ostsData, postData], [postsRequest, postRequest]) => {
    cache.write(postsRequest, ostsData);

    const { posts } = cache.read(postsRequest).data;

    expect(posts.find(p => p.id === postsRequest.variables.id).title).toBe("Quam odit");

    cache.write(postRequest, {
      post: { ...postData.post, title: "updated title" }
    });

    const { posts: updatedPosts } = cache.read(postsRequest).data;

    expect(updatedPosts.find(p => p.id === postsRequest.variables.id).title).toBe("updated title");
  });
});

test("should merge objects in the cache when removing or adding properties", async () => {
  await mock(Post, async (cache, data, request) => {
    cache.write(request, data);

    const post = JSON.parse(JSON.stringify(cache.read(request).data.post));

    delete post.__typename;

    post.foo = "bar";

    cache.write(request, { post });

    expect(cache.read(request, true).data.post).toEqual({
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

test("should call cache listeners on write with paths objects as arguments", async () => {
  await mock(Post, async (cache, data, request) => {
    const listener = sinon.spy();
    const listener2 = sinon.spy();

    const unlisten = cache.listen(listener);
    cache.listen(listener2);

    cache.write(request, data);

    const [lastCallArg] = listener.lastCall.args;

    expect(cache.read(request).objects).toEqual(lastCallArg);

    unlisten();
    cache.write(request, data);

    expect(listener.calledOnce).toBe(true);
    expect(listener2.calledTwice).toBe(true);

    unlisten();
    cache.write(request, data);

    expect(listener2.calledThrice).toBe(true);
  });
});

test("should be able read from the cache with a declared initialState", async () => {
  await mock(Authors, async (cache, data, request) => {
    cache.write(request, data);

    cache = createCache({ initialState: cache.flush() });

    expect(cache.read(request).data).toEqual(data);
  });
});

test("should accept `idFromProps` function in options", async () => {
  await mock(Authors, async (_, data, request) => {
    const cache = createCache({ idFromProps: obj => obj.__typename + ":" + obj.id });

    cache.write(request, data);

    expect(Object.keys(cache.flush().objectsMap).every(key => /(Post|Author):/.test(key))).toBe(
      true
    );
  });
});

async function mock(...args) {
  // tslint:disable-next-line prefer-const
  let [sources, variables, fn] = args;
  const { query } = sources;
  const cache = createCache();
  let results;
  let requests;

  if (args.length < 3) {
    fn = variables;
    // default post id
    variables = { id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };
  }

  if (Array.isArray(sources)) {
    requests = sources.map(query => ({ query, variables }));
    results = (await Promise.all(
      sources.map(({ query }) => executeQuery({ query, variables }))
    )).map(_ => _.data);
  } else {
    requests = { query: sources, variables };
    results = (await executeQuery({ query, variables })).data;
  }

  await fn(cache, results, requests);
}
