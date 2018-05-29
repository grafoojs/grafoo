import createBindings from "../src";
import createClient from "@grafoo/core";
import { ClientInstance, Bindings } from "@grafoo/types";
import { mockQueryRequest, Authors } from "@grafoo/test-utils";

interface Post {
  title: string;
  content: string;
  id: string;
  __typename: string;
  author: Author;
}

interface Author {
  name: string;
  id: string;
  __typename: string;
  posts?: Array<Post>;
}

interface Authors {
  authors: Author[];
}

describe("@grafoo/bindings", () => {
  let client: ClientInstance;
  let bindings: Bindings;
  beforeEach(() => {
    jest.resetAllMocks();
    client = createClient("https://some.graphql.api/");
  });

  it("should be evocable given the minimal props", () => {
    expect(() => (bindings = createBindings(client, {}, () => void 0))).not.toThrow();

    Object.keys(bindings).forEach(fn => {
      expect(typeof bindings[fn]).toBe("function");
    });
  });

  it("should provide the right initial state", () => {
    bindings = createBindings(client, {}, () => void 0);

    expect(bindings.getState()).toEqual({ loading: true, loaded: false });
  });

  it("should execute a query", async () => {
    const { data } = await mockQueryRequest(Authors);

    const renderFn = jest.fn();

    bindings = createBindings(client, { query: Authors }, renderFn);

    await bindings.executeQuery();

    expect(renderFn).toHaveBeenCalledWith({ ...data, loading: false, loaded: true });
  });

  it("should provide the data if the query is already cached", async () => {
    const { data } = await mockQueryRequest(Authors);

    client.write({ query: Authors }, data);

    bindings = createBindings(client, { query: Authors }, () => void 0);

    expect(bindings.getState()).toMatchObject({ loaded: true, loading: false, ...data });
  });

  it("should trigger updater function if the cache has been updated", async () => {
    const { data } = await mockQueryRequest(Authors);

    const renderFn = jest.fn();

    bindings = createBindings(client, { query: Authors }, renderFn);

    client.write({ query: Authors }, data);

    expect(renderFn).toHaveBeenCalledWith(data);
  });

  it("should provide the state for a cached query", async () => {
    const { data } = await mockQueryRequest(Authors);

    client.write({ query: Authors }, data);

    const renderFn = jest.fn();

    bindings = createBindings(client, { query: Authors }, renderFn);

    expect(bindings.getState()).toMatchObject({ loaded: true, loading: false, ...data });
  });

  it("should stop updating if unbind has been called", async () => {
    const { data } = await mockQueryRequest(Authors);

    const renderFn = jest.fn();

    bindings = createBindings(client, { query: Authors }, renderFn);

    await bindings.executeQuery();

    bindings.unbind();

    client.write(
      { query: Authors },
      { authors: data.authors.map((a, i) => (!i ? { ...a, name: "Homer" } : a)) }
    );

    expect(renderFn).toHaveBeenCalledTimes(1);
    expect(client.read<Authors>({ query: Authors }).data.authors[0].name).toBe("Homer");
    expect(renderFn).toHaveBeenCalledWith({ ...data, loading: false, loaded: true });
  });
});
