import test from "ava";
import sinon from "sinon";

import executeQuery from "../__mocks__/execute-query";
import { PostsAndAuthors, Authors, Post, Posts } from "../__mocks__/queries";

import createCache from "../src";

test("should be instantiable", t => {
  const cache = createCache();

  t.is(typeof cache.listen, "function");
  t.is(typeof cache.write, "function");
  t.is(typeof cache.read, "function");
  t.is(typeof cache.flush, "function");
});

test("should write queries to the cache", async t => {
  await mock(PostsAndAuthors, async (cache, data, request) => {
    cache.write(request, data);

    const { authors, posts } = data;
    const { objectsMap, pathsMap } = cache.flush();

    t.deepEqual(
      authors,
      pathsMap["authors{__typename id name posts{__typename body id title}}"].data.authors
    );
    t.deepEqual(
      posts,
      pathsMap["posts{__typename author{__typename id name}body id title}"].data.posts
    );
    t.true(authors.every(author => Boolean(objectsMap[author.id])));
    t.true(posts.every(post => Boolean(objectsMap[post.id])));
  });
});

test("should read queries from the cache", async t => {
  await mock(Authors, async (cache, data, request) => {
    cache.write(request, data);

    const result = cache.read(request);

    const { authors } = data;

    t.deepEqual(authors, result.data.authors);
    t.true(authors.every(author => Boolean(result.objects[author.id])));
    t.true(authors.every(author => author.posts.every(post => Boolean(result.objects[post.id]))));
  });
});

test("should handle queries with variables", async t => {
  await mock(Post, async (cache, data, request) => {
    cache.write(request, data);

    t.is(cache.read({ query: Post, variables: { id: "123" } }), null);
    t.is(cache.read(request).data.post.id, request.variables.id);
  });
});

test("should perform update to cache", async t => {
  await mock(Post, async (cache, data, request) => {
    cache.write(request, data);

    const { data: { post } } = cache.read(request);

    t.is(post.title, "Quam odit");

    cache.write(request, { post: Object.assign({}, post, { title: "updated title" }) });

    t.is(cache.read(request).data.post.title, "updated title");
  });
});

test("should reflect updates on queries with shared objects", async t => {
  await mock([Posts, Post], async (cache, [ostsData, postData], [postsRequest, postRequest]) => {
    cache.write(postsRequest, ostsData);

    const { posts } = cache.read(postsRequest).data;

    t.is(posts.find(p => p.id === postsRequest.variables.id).title, "Quam odit");

    cache.write(postRequest, {
      post: Object.assign(postData.post, { title: "updated title" })
    });

    const { posts: updatedPosts } = cache.read(postsRequest).data;

    t.is(updatedPosts.find(p => p.id === postsRequest.variables.id).title, "updated title");
  });
});

test("should merge objects in the cache when removing or adding properties", async t => {
  await mock(Post, async (cache, data, request) => {
    cache.write(request, data);

    const post = JSON.parse(JSON.stringify(cache.read(request).data.post));

    delete post.__typename;

    post.foo = "bar";

    cache.write(request, { post });

    t.deepEqual(cache.read(request, true).data.post, {
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

test("should call cache listeners on write with paths objects as arguments", async t => {
  await mock(Post, async (cache, data, request) => {
    const listener = sinon.spy();

    cache.listen(listener);

    cache.write(request, data);

    const [lastCallArg] = listener.lastCall.args;

    t.deepEqual(cache.read(request).objects, lastCallArg);
  });
});

test("should be able read from the cache with a declared initialState", async t => {
  await mock(Authors, async (cache, data, request) => {
    cache.write(request, data);

    cache = createCache({ initialState: cache.flush() });

    t.deepEqual(cache.read(request).data, data);
  });
});

test("should accept `idFromProps` function in options", async t => {
  await mock(Authors, async (_, data, request) => {
    const cache = createCache({ idFromProps: obj => obj.__typename + ":" + obj.id });

    cache.write(request, data);

    t.true(Object.keys(cache.flush().objectsMap).every(_ => /(Post|Author):/.test(_)));
  });
});

async function mock(...args) {
  let [sources, variables, fn] = args;
  const { query } = sources;
  let results, requests;
  const cache = createCache();

  if (args.length < 3)
    (fn = variables), (variables = { id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" });

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
