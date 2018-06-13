import createBindings from "../src";
import createClient from "@grafoo/core";
import { ClientInstance, Bindings, GrafooMutation } from "@grafoo/types";
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

interface AllAuthors {
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
  let bindings: Bindings;
  beforeEach(() => {
    jest.resetAllMocks();
    client = createClient("https://some.graphql.api/", { idFields: ["id"] });
  });

  it("should be evocable given the minimal props", () => {
    expect(() => (bindings = createBindings(client, {}, () => void 0))).not.toThrow();

    Object.keys(bindings).forEach(fn => {
      expect(typeof bindings[fn]).toBe("function");
    });

    expect(bindings.unbind()).toBeUndefined();
  });

  it("should provide the right initial state", () => {
    bindings = createBindings(client, {}, () => void 0);

    expect(bindings.getState()).toMatchObject({
      client,
      load: bindings.load,
      loaded: false,
      loading: true
    });
  });

  it("should execute a query", async () => {
    const { data } = await mockQueryRequest(Authors);

    const renderFn = jest.fn();

    bindings = createBindings(client, { query: Authors }, renderFn);

    await bindings.load();

    expect(renderFn).toHaveBeenCalled();
    expect(bindings.getState()).toMatchObject({
      ...data,
      client,
      load: bindings.load,
      loaded: true,
      loading: false
    });
  });

  it("should provide the data if the query is already cached", async () => {
    const { data } = await mockQueryRequest(Authors);

    client.write(Authors, data);

    bindings = createBindings(client, { query: Authors }, () => void 0);

    expect(bindings.getState()).toMatchObject({
      ...data,
      loaded: true,
      loading: false
    });
  });

  it("should trigger updater function if the cache has been updated", async () => {
    const { data } = await mockQueryRequest(Authors);

    const renderFn = jest.fn();

    bindings = createBindings(client, { query: Authors }, renderFn);

    client.write(Authors, data);

    expect(renderFn).toHaveBeenCalled();
    expect(bindings.getState()).toMatchObject(data);
  });

  it("should provide the state for a cached query", async () => {
    const { data } = await mockQueryRequest(Authors);

    client.write(Authors, data);

    const renderFn = jest.fn();

    bindings = createBindings(client, { query: Authors }, renderFn);

    expect(bindings.getState()).toMatchObject(data);
  });

  it("should stop updating if unbind has been called", async () => {
    const { data } = await mockQueryRequest(Authors);

    const renderFn = jest.fn();

    bindings = createBindings(client, { query: Authors }, renderFn);

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

    bindings = createBindings(client, { query: FailAuthors }, renderFn);

    await bindings.load();

    expect(renderFn).toHaveBeenCalledTimes(1);
    expect(bindings.getState()).toMatchObject({ errors });
  });

  it("should provide mutations", async () => {
    await mockQueryRequest(Authors);

    type CreateAuthorMutations = GrafooMutation<AllAuthors, CreateAuthor>;

    const createAuthor: CreateAuthorMutations = {
      query: CreateAuthor,
      update: ({ authors }, data) => ({
        authors: [data.createAuthor, ...authors]
      })
    };

    const update = jest.spyOn(createAuthor, "update");

    bindings = createBindings(
      client,
      { query: Authors, mutations: { createAuthor } },
      () => void 0
    );

    const props = bindings.getState() as any;

    expect(typeof props.createAuthor).toBe("function");

    await bindings.load();

    const variables = { name: "Homer" };

    const { data } = await mockQueryRequest({ ...CreateAuthor, variables });

    await props.createAuthor(variables);

    expect(update).toHaveBeenCalledWith(props, data);
  });

  it("should perform optimistic update", async () => {
    await mockQueryRequest(Authors);

    type CreateAuthorMutations = GrafooMutation<AllAuthors, CreateAuthor>;

    const createAuthor: CreateAuthorMutations = {
      query: CreateAuthor,
      optimisticUpdate: ({ authors }, variables: Author) => ({
        authors: [{ ...variables, id: "tempID" }, ...authors]
      }),
      update: ({ authors }, data) => ({
        authors: authors.map(p => (p.id === "tempID" ? data.createAuthor : p))
      })
    };

    const optimisticUpdate = jest.spyOn(createAuthor, "optimisticUpdate");
    const update = jest.spyOn(createAuthor, "update");

    bindings = createBindings(
      client,
      { query: Authors, mutations: { createAuthor } },
      () => void 0
    );

    const props = bindings.getState() as any;

    expect(typeof props.createAuthor).toBe("function");

    await bindings.load();

    const variables = { name: "Peter" };

    const { data } = await mockQueryRequest({ ...CreateAuthor, variables });

    await props.createAuthor(variables);

    expect(optimisticUpdate).toHaveBeenCalledWith(props, variables);
    expect(update).toHaveBeenCalledWith(props, data);
  });
});
