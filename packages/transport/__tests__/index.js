import test from "ava";
import fetchMock from "fetch-mock";

import createTransport from "../src";

const fakeAPI = "http://fake-api.com/graphql";
const query = "{ hello }";
let request;

test.beforeEach(() => {
  request = createTransport(fakeAPI);
});

test("should perform a simple request", async t => {
  await mock(async () => {
    await request({ query });

    const [, { body, headers, method }] = fetchMock.lastCall();

    t.is(method, "POST");
    t.is(body, JSON.stringify({ query }));
    t.deepEqual(headers, { "Content-Type": "application/json" });
  });
});

test("should perform a request with variables", async t => {
  await mock(async () => {
    const variables = { some: "variable" };

    await request({ query, variables });

    const [, { body }] = fetchMock.lastCall();

    t.deepEqual(JSON.parse(body).variables, variables);
  });
});

test("should accept fetchObjects as an object", async t => {
  request = createTransport(fakeAPI, { authorization: "Bearer some-token" });

  await mock(async () => {
    await request({ query });

    const [, { headers }] = fetchMock.lastCall();

    t.deepEqual(headers, {
      authorization: "Bearer some-token",
      "Content-Type": "application/json"
    });
  });
});

test("should accept fetchObjects as a function", async t => {
  request = createTransport(fakeAPI, () => ({ authorization: "Bearer some-token" }));

  await mock(async () => {
    await request({ query });

    const [, { headers }] = fetchMock.lastCall();

    t.deepEqual(headers, {
      authorization: "Bearer some-token",
      "Content-Type": "application/json"
    });
  });
});

test("should handle graphql errors", async t => {
  const response = { data: null, errors: [{ message: "I AM ERROR!" }] };

  await mock(response, async () => {
    const error = await t.throws(
      request({ query }),
      'graphql error on request {"query":"{ hello }"}'
    );

    t.deepEqual(error.errors, response.errors);
  });
});

async function mock(...args) {
  let [response, testFn] = args;

  if (args.length === 1) {
    testFn = response;
    response = { data: { hello: "world" } };
  }

  fetchMock.mock(fakeAPI, response);

  await testFn();

  fetchMock.restore();
}
