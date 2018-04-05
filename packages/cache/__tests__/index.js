import test from "ava";

import executeQuery from "../__mocks__/execute-query";
import { PostsAndAuthors, Authors, Post } from "../__mocks__/queries";

import createCache from "../src";

test("should not throw", t => t.notThrows(createCache));

test("should be instantiable", t => {
  const cache = createCache();

  t.is(typeof cache.watch, "function");
  t.is(typeof cache.write, "function");
  t.is(typeof cache.read, "function");
  t.is(typeof cache.flush, "function");
});

test("should write queries to the cache", async t => {
  const { query } = PostsAndAuthors;
  const { data } = await executeQuery({ query });

  const cache = createCache();

  cache.write({ query: PostsAndAuthors }, data);

  const state = cache.flush();

  t.truthy(state.objectsMap);
  t.truthy(state.pathsMap);
  t.snapshot(state);
});

test("should read queries from the cache", async t => {
  const { query } = Authors;
  const { data } = await executeQuery({ query });

  const cache = createCache();

  cache.write({ query: Authors }, data);

  const state = cache.read({ query: Authors });

  t.truthy(state.data);
  t.truthy(state.objects);
  t.snapshot(state);
});

test("should handle queries with variables", async t => {
  const { query } = Post;
  const variables = { id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" };
  const { data } = await executeQuery({ query, variables });

  const cache = createCache();

  cache.write({ query: Post, variables }, data);

  t.is(cache.read({ query: Post, variables: { id: "123" } }), null);

  const dataFromCache = cache.read({ query: Post, variables });

  t.snapshot(dataFromCache);
});
