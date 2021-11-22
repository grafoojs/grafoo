import createBindings, { makeGrafooConfig } from "../src";
import createClient, { GrafooClient } from "@grafoo/core";
import { mockQueryRequest, createTransport } from "@grafoo/test-utils";
import {
  AUTHOR,
  AUTHORS,
  AuthorsQuery,
  CREATE_AUTHOR,
  CreateAuthorMutation,
  DELETE_AUTHOR,
  DeleteAuthorMutation,
  POSTS_AND_AUTHORS,
  UPDATE_AUTHOR
} from "./queries";

describe("@grafoo/bindings", () => {
  let client: GrafooClient;
  beforeEach(() => {
    jest.resetAllMocks();
    let transport = createTransport("https://some.graphql.api/");
    client = createClient(transport, { idFields: ["id"] });
  });

  it("should be evocable given the minimal props", () => {
    let bindings;
    expect(() => (bindings = createBindings(client, () => {}, {}))).not.toThrow();

    Object.keys(bindings).forEach((fn) => {
      expect(typeof bindings[fn]).toBe("function");
    });

    expect(bindings.unbind()).toBeUndefined();
  });

  it("should not provide any data if no query or mutation is given", () => {
    let bindings = createBindings(client, () => {}, {});
    let state = bindings.getState();

    expect(state).toEqual({ loaded: false, loading: false });
  });

  it("should execute a query", async () => {
    let { data } = await mockQueryRequest<AuthorsQuery>(AUTHORS);
    let renderFn = jest.fn();
    let bindings = createBindings(client, renderFn, { query: AUTHORS });

    expect(bindings.getState()).toEqual({ loaded: false, loading: true });

    await bindings.load();

    let results = renderFn.mock.calls.map((c) => c[0]);

    expect(results).toEqual([{ ...data, loaded: true, loading: false }]);
  });

  it("should notify a loading state", async () => {
    let { data } = await mockQueryRequest<AuthorsQuery>(AUTHORS);
    let renderFn = jest.fn();
    let bindings = createBindings(client, renderFn, { query: AUTHORS });

    await bindings.load();
    await bindings.load();

    let results = renderFn.mock.calls.map((c) => c[0]);

    expect(results).toEqual([
      { loaded: true, loading: false, ...data },
      { loaded: true, loading: true, ...data },
      { loaded: true, loading: false, ...data }
    ]);
  });

  it("should provide the data if the query is already cached", async () => {
    let { data } = await mockQueryRequest<AuthorsQuery>(AUTHORS);

    client.write(AUTHORS, data);

    let bindings = createBindings(client, () => {}, { query: AUTHORS });

    expect(bindings.getState()).toEqual({ ...data, loaded: true, loading: false });
  });

  it("should provide the data if a query is partialy cached", async () => {
    let { data } = await mockQueryRequest<AuthorsQuery>(AUTHORS);

    client.write(AUTHORS, data);

    let bindings = createBindings(client, () => {}, { query: POSTS_AND_AUTHORS });

    expect(bindings.getState()).toEqual({ ...data, loaded: false, loading: true });
  });

  it("should provide the state for a cached query", async () => {
    let { data } = await mockQueryRequest<AuthorsQuery>(AUTHORS);

    client.write(AUTHORS, data);

    let renderFn = jest.fn();
    let bindings = createBindings(client, renderFn, { query: AUTHORS });

    expect(bindings.getState()).toEqual({ ...data, loaded: true, loading: false });
  });

  it("should stop updating if unbind has been called", async () => {
    let { data } = await mockQueryRequest<AuthorsQuery>(AUTHORS);
    let bindings = createBindings(client, () => {}, { query: AUTHORS });

    await bindings.load();
    bindings.unbind();

    let clonedData: AuthorsQuery = JSON.parse(JSON.stringify(data));
    clonedData.authors.edges[0].node.name = "Homer";

    client.write(AUTHORS, clonedData);
    expect(client.read(AUTHORS).data.authors.edges[0].node.name).toBe("Homer");
    expect(bindings.getState().authors).toEqual(data.authors);
  });

  it("should provide errors on bad request", async () => {
    let failedQuery = { ...AUTHORS, document: AUTHORS.document.substr(1) };
    let { errors } = await mockQueryRequest(failedQuery);
    let renderFn = jest.fn();
    let bindings = createBindings(client, renderFn, { query: failedQuery });

    await bindings.load();

    expect(renderFn).toHaveBeenCalledTimes(1);
    expect(bindings.getState()).toEqual({ loading: false, loaded: false, errors });
  });

  it("should perform a simple mutation", async () => {
    let bindings = createBindings(client, () => {}, {
      mutations: {
        createAuthor: { query: CREATE_AUTHOR }
      }
    });

    let props = bindings.getState();
    let variables = { input: { name: "Bart" } };
    let { data } = await mockQueryRequest(CREATE_AUTHOR, variables);
    let { data: mutationData } = await props.createAuthor(variables);

    expect(mutationData).toEqual(data);
  });

  it("should perform mutation with a cache update", async () => {
    await mockQueryRequest(AUTHORS);

    let init = makeGrafooConfig({
      query: AUTHORS,
      mutations: {
        createAuthor: {
          query: CREATE_AUTHOR,
          update: ({ authors }, data) => ({
            authors: {
              edges: [{ node: data.createAuthor.author }, ...authors.edges]
            }
          })
        }
      }
    });

    let update = jest.spyOn(init.mutations.createAuthor, "update");
    let bindings = createBindings(client, () => {}, init);
    let props = bindings.getState();

    expect(typeof props.createAuthor).toBe("function");

    await bindings.load();

    let variables = { input: { name: "homer" } };
    let { data } = await mockQueryRequest(CREATE_AUTHOR, variables);
    let { authors } = bindings.getState();

    await props.createAuthor(variables);

    expect(update).toHaveBeenCalledWith({ authors }, data);
  });

  it("should perform optimistic update", async () => {
    await mockQueryRequest(AUTHORS);

    let init = makeGrafooConfig({
      query: AUTHORS,
      mutations: {
        createAuthor: {
          query: CREATE_AUTHOR,
          optimisticUpdate: ({ authors }, variables) => ({
            authors: {
              ...authors,
              edges: [{ node: { ...variables.input, id: "tempID" } }, ...authors.edges]
            }
          }),
          update: ({ authors }, data) => ({
            authors: {
              edges: authors.edges.map((p) =>
                p.node.id === "tempID" ? { node: data.createAuthor.author } : p
              )
            }
          })
        }
      }
    });

    let optimisticUpdate = jest.spyOn(init.mutations.createAuthor, "optimisticUpdate");
    let update = jest.spyOn(init.mutations.createAuthor, "update");
    let bindings = createBindings(client, () => {}, init);
    let props = bindings.getState();

    expect(typeof props.createAuthor).toBe("function");

    await bindings.load();

    let variables = { input: { name: "marge" } };
    let { data } = await mockQueryRequest(CREATE_AUTHOR, variables);
    let { authors } = bindings.getState();
    let createAuthorPromise = props.createAuthor(variables);

    expect(optimisticUpdate).toHaveBeenCalledWith({ authors }, variables);

    let { authors: modifiedAuthors } = bindings.getState();

    await createAuthorPromise;

    expect(update).toHaveBeenCalledWith({ authors: modifiedAuthors }, data);
  });

  it("should update if query records has less keys then nextRecords", async () => {
    let {
      data: { createAuthor }
    } = await mockQueryRequest<CreateAuthorMutation>(CREATE_AUTHOR, {
      input: { name: "flanders" }
    });
    let { data } = await mockQueryRequest<AuthorsQuery>(AUTHORS);

    client.write(AUTHORS, data);

    let renderFn = jest.fn();

    let bindings = createBindings(client, renderFn, {
      query: AUTHORS,
      mutations: {
        removeAuthor: {
          query: DELETE_AUTHOR,
          optimisticUpdate: ({ authors }, { input: { id } }) => ({
            authors: {
              edges: authors.edges.filter((author) => author.node.id !== id)
            }
          })
        }
      }
    });

    let { removeAuthor } = bindings.getState();
    let variables = { input: { id: createAuthor.author.id } };

    await mockQueryRequest<DeleteAuthorMutation>(DELETE_AUTHOR, variables);
    await removeAuthor(variables);

    expect(renderFn).toHaveBeenCalled();
  });

  it("should update if query objects is modified", async () => {
    let {
      data: { createAuthor }
    } = await mockQueryRequest<CreateAuthorMutation>(CREATE_AUTHOR, {
      input: { name: "milhouse" }
    });
    let { data } = await mockQueryRequest<AuthorsQuery>(AUTHORS);

    client.write(AUTHORS, data);

    let init = makeGrafooConfig({
      query: AUTHORS,
      mutations: {
        updateAuthor: {
          query: UPDATE_AUTHOR,
          optimisticUpdate: ({ authors }, variables) => ({
            authors: {
              edges: authors.edges.map((author) =>
                author.node.id === variables.input.id
                  ? { node: { ...author.node, ...variables.input } }
                  : author
              )
            }
          })
        }
      }
    });

    let renderFn = jest.fn();
    let bindings = createBindings(client, renderFn, init);
    let { updateAuthor } = bindings.getState();
    let variables = { input: { ...createAuthor.author, name: "moe" } };

    await mockQueryRequest(UPDATE_AUTHOR, variables);
    await updateAuthor(variables);

    expect(renderFn).toHaveBeenCalled();
  });

  it("should not update if query objects is not modified", async () => {
    let { data } = await mockQueryRequest<AuthorsQuery>(AUTHORS);

    client.write(AUTHORS, data);

    let renderFn = jest.fn();

    createBindings(client, renderFn, { query: AUTHORS });

    client.write(AUTHORS, data);

    expect(renderFn).not.toHaveBeenCalled();
  });

  it("should accept multiple mutations", async () => {
    let authors = await mockQueryRequest<AuthorsQuery>(AUTHORS);
    client.write(AUTHORS, authors.data);

    let init = makeGrafooConfig({
      query: AUTHORS,
      mutations: {
        createAuthor: {
          query: CREATE_AUTHOR,
          optimisticUpdate: ({ authors }, variables) => ({
            authors: {
              edges: [{ node: { ...variables.input, id: "tempID" } }, ...authors.edges]
            }
          }),
          update: ({ authors }, data) => ({
            authors: {
              edges: authors.edges.map((author) =>
                author.node.id === "tempID"
                  ? { node: { ...author.node, ...data.createAuthor.author } }
                  : author
              )
            }
          })
        },
        updateAuthor: {
          query: UPDATE_AUTHOR,
          optimisticUpdate: ({ authors }, variables) => ({
            authors: {
              edges: authors.edges.map((author) =>
                author.node.id === variables.input.id
                  ? { node: { ...author.node, ...variables.input } }
                  : author
              )
            }
          })
        },
        deleteAuthor: {
          query: DELETE_AUTHOR,
          optimisticUpdate: ({ authors }, variables) => ({
            authors: {
              edges: authors.edges.filter((author) => author.node.id !== variables.input.id)
            }
          })
        }
      }
    });

    let renderFn = jest.fn();
    let bindings = createBindings(client, renderFn, init);
    let props = bindings.getState();

    let createVariables = { input: { name: "crusty" } };
    let { data } = await mockQueryRequest<CreateAuthorMutation>(CREATE_AUTHOR, createVariables);
    expect(await mockQueryRequest(CREATE_AUTHOR, createVariables)).toEqual(
      await props.createAuthor(createVariables)
    );

    let updateVariables = { input: { ...data.createAuthor.author, name: "lisa" } };
    expect(await mockQueryRequest(UPDATE_AUTHOR, updateVariables)).toEqual(
      await props.updateAuthor(updateVariables)
    );

    let deleteVariables = { input: { id: data.createAuthor.author.id } };
    expect(await mockQueryRequest(DELETE_AUTHOR, deleteVariables)).toEqual(
      await props.deleteAuthor(deleteVariables)
    );
  });

  it("should update variables when new variables are passed", async () => {
    let {
      data: { authors }
    } = await mockQueryRequest(AUTHORS);

    let [author1, author2] = authors.edges;
    let author1Variables = { id: author1.node.id };
    let author2Variables = { id: author2.node.id };

    let bindings = createBindings(client, () => {}, { query: AUTHOR, variables: author1Variables });

    await mockQueryRequest(AUTHOR, author1Variables);
    await bindings.load();
    expect(bindings.getState().author).toEqual(author1.node);
    expect(client.read(AUTHOR, author1Variables).data.author).toEqual(author1.node);

    await mockQueryRequest(AUTHOR, author2Variables);
    await bindings.load(author2Variables);
    expect(bindings.getState().author).toEqual(author2.node);
    expect(client.read(AUTHOR, author2Variables).data.author).toEqual(author2.node);
  });
});
