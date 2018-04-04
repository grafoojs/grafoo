import test from "ava";

import executeQuery from "../__mocks__/execute-query";
import * as queries from "../__mocks__/queries";

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
  const cache = createCache();

  const { query } = queries.Authors;
  const { data } = await executeQuery({ query });

  cache.write({ query: queries.Authors }, data);

  t.pass();
});
