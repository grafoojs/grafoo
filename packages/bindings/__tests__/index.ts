import createBindings from "../src";
import createClient from "@grafoo/core";
import { ClientInstance, Bindings } from "@grafoo/types";
import { mockQueryRequest, Authors } from "@grafoo/test-utils";

async function sleep(ms?: number) {
  return new Promise(r => setTimeout(r, ms));
}

describe("@grafoo/bindings", () => {
  let client: ClientInstance;
  let bindings: Bindings;
  beforeEach(() => {
    jest.resetAllMocks();
    client = createClient("https://some.graphql.api/");
  });

  it("should be evocable given the minimal props", () => {
    expect(() => (bindings = createBindings({}, client, () => void 0))).not.toThrow();

    Object.keys(bindings).forEach(fn => {
      expect(typeof bindings[fn]).toBe("function");
    });
  });

  it("should provide the right initial state", () => {
    bindings = createBindings({}, client, () => void 0);

    expect(bindings.getState()).toEqual({ loading: true, loaded: false });
  });

  it("should execute a query", async () => {
    const { data } = await mockQueryRequest(Authors);

    const renderFn = jest.fn();

    bindings = createBindings({ query: Authors }, client, renderFn);

    bindings.executeQuery();

    await sleep();

    expect(renderFn).toHaveBeenCalledWith({ ...data, loading: false, loaded: true });
  });

  it("should provide the data if the query is already cached", async () => {
    const { data } = await mockQueryRequest(Authors);

    client.write({ query: Authors }, data);

    bindings = createBindings({ query: Authors }, client, () => void 0);

    expect(bindings.getState()).toMatchObject({ loaded: true, loading: false, ...data });
  });
});
