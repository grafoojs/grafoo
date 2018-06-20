import createBindings from "../src";
import createClient from "@grafoo/core";
import { ClientInstance, GrafooMutations } from "@grafoo/types";
import { mockQueryRequest, Authors, CreateAuthor } from "@grafoo/test-utils";

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

interface CreateAuthor {
  createAuthor: {
    name: string;
    id: string;
    __typename: string;
    posts?: Array<Post>;
  };
}

describe("@grafoo/bindings", () => {
  let client: ClientInstance;
  beforeEach(() => {
    jest.resetAllMocks();
    client = createClient("https://some.graphql.api/", { idFields: ["id"] });
  });

  it("should be evocable given the minimal props", () => {
    let bindings;
    expect(() => (bindings = createBindings(client, {}, () => void 0))).not.toThrow();

    Object.keys(bindings).forEach(fn => {
      expect(typeof bindings[fn]).toBe("function");
    });

    expect(bindings.unbind()).toBeUndefined();
  });

  it("should not provide any data if no query or mutation is given", () => {
    const bindings = createBindings(client, {}, () => void 0);

    const props = bindings.getState();

    expect(props).toEqual({ client });
  });

  it("should execute a query", async () => {
    const { data } = await mockQueryRequest(Authors);

    const renderFn = jest.fn();

    const bindings = createBindings<Authors>(client, { query: Authors }, renderFn);

    await bindings.load();

    expect(renderFn).toHaveBeenCalledTimes(1);
    expect(bindings.getState()).toMatchObject({ ...data, loaded: true, loading: false });
  });

  it("should notify a loading state", async () => {
    const { data } = await mockQueryRequest(Authors);

    const renderFn = jest.fn();

    const bindings = createBindings<Authors>(client, { query: Authors }, renderFn);

    await bindings.load();

    expect(renderFn).toHaveBeenCalledTimes(1);
    expect(bindings.getState()).toMatchObject({ ...data, loaded: true, loading: false });

    const reloadPromise = bindings.load();

    expect(bindings.getState().loading).toBe(true);

    await reloadPromise;

    expect(bindings.getState().loading).toBe(false);
  });

  it("should provide the data if the query is already cached", async () => {
    const { data } = await mockQueryRequest(Authors);

    client.write(Authors, data);

    const bindings = createBindings<Authors>(client, { query: Authors }, () => void 0);

    expect(bindings.getState()).toMatchObject({ ...data, loaded: true, loading: false });
  });

  it("should trigger updater function if the cache has been updated", async () => {
    const { data } = await mockQueryRequest(Authors);

    const renderFn = jest.fn();

    const bindings = createBindings<Authors>(client, { query: Authors }, renderFn);

    client.write(Authors, data);

    expect(renderFn).toHaveBeenCalled();
    expect(bindings.getState()).toMatchObject(data);
  });

  it("should provide the state for a cached query", async () => {
    const { data } = await mockQueryRequest(Authors);

    client.write(Authors, data);

    const renderFn = jest.fn();

    const bindings = createBindings<Authors>(client, { query: Authors }, renderFn);

    expect(bindings.getState()).toMatchObject(data);
  });

  it("should stop updating if unbind has been called", async () => {
    const { data } = await mockQueryRequest(Authors);

    const renderFn = jest.fn();

    const bindings = createBindings<Authors>(client, { query: Authors }, renderFn);

    await bindings.load();

    bindings.unbind();

    client.write(Authors, {
      authors: data.authors.map((a, i) => (!i ? { ...a, name: "Homer" } : a))
    });

    expect(client.read<Authors>(Authors).data.authors[0].name).toBe("Homer");
    expect(renderFn).toHaveBeenCalledTimes(1);
    expect(bindings.getState()).toMatchObject(data);
  });

  it("should provide errors on bad request", async () => {
    const FailAuthors = { ...Authors, query: Authors.query.substr(1) };

    const { errors } = await mockQueryRequest(FailAuthors);

    const renderFn = jest.fn();

    const bindings = createBindings(client, { query: FailAuthors }, renderFn);

    await bindings.load();

    expect(renderFn).toHaveBeenCalledTimes(1);
    expect(bindings.getState()).toMatchObject({ errors });
  });

  it("should perform a simple mutation", async () => {
    interface Mutations {
      createAuthor: CreateAuthor;
    }

    const bindings = createBindings<{}, Mutations>(
      client,
      { mutations: { createAuthor: { query: CreateAuthor } } },
      () => void 0
    );

    const props = bindings.getState();

    const variables = { name: "Bart" };

    const { data } = await mockQueryRequest({ ...CreateAuthor, variables });

    const author = await props.createAuthor(variables);

    expect(author).toEqual(data);
  });

  it("should perform mutation with cache update", async () => {
    await mockQueryRequest(Authors);

    interface Mutations {
      createAuthor: CreateAuthor;
    }

    const mutations: GrafooMutations<Authors, Mutations> = {
      createAuthor: {
        query: CreateAuthor,
        update: ({ authors }, data) => ({
          authors: [data.createAuthor, ...authors]
        })
      }
    };

    const update = jest.spyOn(mutations.createAuthor, "update");

    const bindings = createBindings<Authors, Mutations>(
      client,
      { query: Authors, mutations },
      () => void 0
    );

    const props = bindings.getState();

    expect(typeof props.createAuthor).toBe("function");

    await bindings.load();

    const variables = { name: "Homer" };

    const { data } = await mockQueryRequest({ ...CreateAuthor, variables });

    await props.createAuthor(variables);

    const { authors } = bindings.getState();

    // the state mutates. update is Actually called without
    // the createAuthor mutation result
    expect(update).toHaveBeenCalledWith({ authors }, data);
  });

  it("should perform optimistic update", async () => {
    await mockQueryRequest(Authors);

    interface Mutations {
      createAuthor: CreateAuthor;
    }

    const mutations: GrafooMutations<Authors, Mutations> = {
      createAuthor: {
        query: CreateAuthor,
        optimisticUpdate: ({ authors }, variables: Author) => ({
          authors: [{ ...variables, id: "tempID" }, ...authors]
        }),
        update: ({ authors }, data) => ({
          authors: authors.map(p => (p.id === "tempID" ? data.createAuthor : p))
        })
      }
    };

    const optimisticUpdate = jest.spyOn(mutations.createAuthor, "optimisticUpdate");
    const update = jest.spyOn(mutations.createAuthor, "update");

    const bindings = createBindings<Authors, Mutations>(
      client,
      { query: Authors, mutations },
      () => void 0
    );

    const props = bindings.getState();

    expect(typeof props.createAuthor).toBe("function");

    await bindings.load();

    const variables = { name: "Peter" };

    const { data } = await mockQueryRequest({ ...CreateAuthor, variables });

    const createAuthorPromise = props.createAuthor(variables);

    const { authors } = bindings.getState();

    expect(optimisticUpdate).toHaveBeenCalledWith({ authors }, variables);

    await createAuthorPromise;

    const { authors: modifiedAuthors } = bindings.getState();

    expect(update).toHaveBeenCalledWith({ authors: modifiedAuthors }, data);
  });
});
