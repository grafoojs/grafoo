/* eslint-disable @typescript-eslint/no-var-requires */

import createTransport from "../src";

jest.mock("node-fetch", () => require("fetch-mock-jest").sandbox());
let fetchMock = require("node-fetch");
global.fetch = fetchMock;

let fakeAPI = "http://fake-api.com/graphql";
let query = "{ hello }";

describe("@grafoo/http-transport", () => {
  let request;
  beforeEach(() => {
    request = createTransport(fakeAPI);
    fetchMock.restore();
  });

  it("should perform a simple request", async () => {
    await mock(async () => {
      await request(query);

      let [, { body, headers, method }] = fetchMock.lastCall();

      expect(method).toBe("POST");
      expect(body).toBe(JSON.stringify({ query }));
      expect(headers).toEqual({ "Content-Type": "application/json" });
    });
  });

  it("should perform a request with variables", async () => {
    await mock(async () => {
      let variables = { some: "variable" };

      await request(query, variables);

      let [, { body }] = fetchMock.lastCall();

      expect(JSON.parse(body as string).variables).toEqual(variables);
    });
  });

  it("should accept fetchObjects as an object", async () => {
    request = createTransport(fakeAPI, { headers: { authorization: "Bearer some-token" } });

    await mock(async () => {
      await request(query);

      let [, { headers }] = fetchMock.lastCall();

      expect(headers).toEqual({
        authorization: "Bearer some-token",
        "Content-Type": "application/json",
      });
    });
  });

  it("should accept fetchObjects as a function", async () => {
    request = createTransport(fakeAPI, () => ({ headers: { authorization: "Bearer some-token" } }));

    await mock(async () => {
      await request(query);

      let [, { headers }] = fetchMock.lastCall();

      expect(headers).toEqual({
        authorization: "Bearer some-token",
        "Content-Type": "application/json",
      });
    });
  });

  it("should handle graphql errors", async () => {
    let response = { data: null, errors: [{ message: "I AM ERROR!" }] };

    await mock(
      async () => expect(request(query)).resolves.toMatchObject({ errors: response.errors }),
      response
    );
  });
});

async function mock(testFn, response?: any) {
  fetchMock.mock(fakeAPI, response || { data: { hello: "world" } });

  await testFn();
}
