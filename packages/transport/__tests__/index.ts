import fetchMock from "fetch-mock";
import createTransport from "../src";

const fakeAPI = "http://fake-api.com/graphql";
const query = "{ hello }";

describe("@grafoo/transport", () => {
  let request;
  beforeEach(() => {
    request = createTransport(fakeAPI);
  });

  it("should perform a simple request", async () => {
    await mock(async () => {
      await request(query);

      const [, { body, headers, method }] = fetchMock.lastCall();

      expect(method).toBe("POST");
      expect(body).toBe(JSON.stringify({ query }));
      expect(headers).toEqual({ "Content-Type": "application/json" });
    });
  });

  it("should perform a request with variables", async () => {
    await mock(async () => {
      const variables = { some: "variable" };

      await request(query, variables);

      const [, { body }] = fetchMock.lastCall();

      expect(JSON.parse(body).variables).toEqual(variables);
    });
  });

  it("should accept fetchObjects as an object", async () => {
    request = createTransport(fakeAPI, { authorization: "Bearer some-token" });

    await mock(async () => {
      await request(query);

      const [, { headers }] = fetchMock.lastCall();

      expect(headers).toEqual({
        authorization: "Bearer some-token",
        "Content-Type": "application/json"
      });
    });
  });

  it("should accept fetchObjects as a function", async () => {
    request = createTransport(fakeAPI, () => ({ authorization: "Bearer some-token" }));

    await mock(async () => {
      await request(query);

      const [, { headers }] = fetchMock.lastCall();

      expect(headers).toEqual({
        authorization: "Bearer some-token",
        "Content-Type": "application/json"
      });
    });
  });

  it("should handle graphql errors", async () => {
    const response = { data: null, errors: [{ message: "I AM ERROR!" }] };

    await mock(response, async () => {
      await expect(request(query)).rejects.toMatchObject({
        message: 'graphql error on request {"query":"{ hello }"}',
        errors: response.errors
      });
    });
  });
});

async function mock(...args) {
  let [response, testFn] = args;

  if (args.length === 1) [testFn, response] = [response, { data: { hello: "world" } }];

  fetchMock.mock(fakeAPI, response);

  await testFn();

  fetchMock.restore();
}
