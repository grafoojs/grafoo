import test from "ava";

import executeQuery from "../__mocks__/execute-query";
import { PostsAndAuthors, Authors } from "../__mocks__/queries";

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
