import createBindings from "../src";
import fetch from "node-fetch";
import graphql from "@grafoo/core/tag";
import createClient, { GrafooClient } from "@grafoo/core";
import { mockQueryRequest, createTransport } from "@grafoo/test-utils";

// @ts-ignore
globalThis.fetch = fetch;

type Post = {
  title: string;
  content: string;
  id: string;
  __typename?: string;
  author: Author;
};

type Author = {
  name: string;
  id: string;
  __typename?: string;
  posts?: Array<Post>;
};

type AuthorsQuery = {
  authors: Author[];
};

let AUTHORS = graphql<AuthorsQuery>`
  query {
    authors {
      name
      posts {
        title
        body
      }
    }
  }
`;

type AuthorQuery = {
  author: Author;
};

type AuthorQueryInput = {
  id: string;
};

let AUTHOR = graphql<AuthorQuery, AuthorQueryInput>`
  query ($id: ID!) {
    author(id: $id) {
      name
      posts {
        title
        body
      }
    }
  }
`;

type PostsQuery = {
  posts: Post[];
};

type PostsAndAuthorsQuery = AuthorsQuery & PostsQuery;

let POSTS_AND_AUTHORS = graphql<PostsAndAuthorsQuery>`
  query {
    posts {
      title
      body
      author {
        name
      }
    }

    authors {
      name
      posts {
        title
        body
      }
    }
  }
`;

type CreateAuthorMutation = {
  createAuthor: {
    name: string;
    id: string;
    __typename: string;
    posts?: Array<Post>;
  };
};

type CreateAuthorInput = {
  name: string;
};

let CREATE_AUTHOR = graphql<CreateAuthorMutation, CreateAuthorInput>`
  mutation ($name: String!) {
    createAuthor(name: $name) {
      name
      posts {
        title
        body
      }
    }
  }
`;

type DeleteAuthorMutation = {
  deleteAuthor: {
    name: string;
    id: string;
    __typename: string;
    posts?: Array<Post>;
  };
};

type DeleteAuthorInput = {
  id: string;
};

let DELETE_AUTHOR = graphql<DeleteAuthorMutation, DeleteAuthorInput>`
  mutation ($id: ID!) {
    deleteAuthor(id: $id) {
      name
      posts {
        title
        body
      }
    }
  }
`;

type UpdateAuthorMutation = {
  updateAuthor: {
    name: string;
    id: string;
    __typename: string;
    posts?: Array<Post>;
  };
};

type UpdateAuthorInput = {
  id?: string;
  name?: string;
};

let UPDATE_AUTHOR = graphql<UpdateAuthorMutation, UpdateAuthorInput>`
  mutation ($id: ID!, $name: String) {
    updateAuthor(id: $id, name: $name) {
      name
      posts {
        title
        body
      }
    }
  }
`;

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

    let props = bindings.getState();

    expect(props).toEqual({ loaded: false, loading: false });
  });

  it("should execute a query", async () => {
    let { data } = await mockQueryRequest<AuthorsQuery>(AUTHORS);

    let renderFn = jest.fn();

    let bindings = createBindings(client, renderFn, { query: AUTHORS });

    expect(bindings.getState()).toEqual({ loaded: false, loading: false });

    await bindings.load();

    let results = renderFn.mock.calls.map((c) => c[0]);

    expect(results).toEqual([
      { loaded: false, loading: true },
      { ...data, loaded: true, loading: false }
    ]);
  });

  it("should notify a loading state", async () => {
    let { data } = await mockQueryRequest<AuthorsQuery>(AUTHORS);

    let renderFn = jest.fn();

    let bindings = createBindings(client, renderFn, { query: AUTHORS });

    await bindings.load();
    await bindings.load();

    let results = renderFn.mock.calls.map((c) => c[0]);

    expect(results).toEqual([
      { loaded: false, loading: true },
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

    expect(bindings.getState()).toEqual({ ...data, loaded: false, loading: false });
  });

  it("should trigger updater function if the cache has been updated", async () => {
    let { data } = await mockQueryRequest<AuthorsQuery>(AUTHORS);

    let renderFn = jest.fn();

    createBindings(client, renderFn, { query: AUTHORS });

    client.write(AUTHORS, data);

    expect(renderFn).toHaveBeenCalledTimes(1);
    expect(renderFn).toHaveBeenCalledWith({ ...data, loaded: true, loading: false });
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

    let renderFn = jest.fn();

    let bindings = createBindings(client, renderFn, { query: AUTHORS });

    await bindings.load();

    bindings.unbind();

    client.write(AUTHORS, {
      authors: data.authors.map((a, i) => (!i ? { ...a, name: "Homer" } : a))
    });

    expect(client.read(AUTHORS).data.authors[0].name).toBe("Homer");
    expect(renderFn).toHaveBeenCalledTimes(2);
    expect(bindings.getState().authors).toEqual(data.authors);
  });

  it("should provide errors on bad request", async () => {
    let FailAuthors = { ...AUTHORS, query: AUTHORS.query.substr(1) };

    let { errors } = await mockQueryRequest(FailAuthors);

    let renderFn = jest.fn();

    let bindings = createBindings(client, renderFn, { query: FailAuthors });

    await bindings.load();

    expect(renderFn).toHaveBeenCalledTimes(2);
    expect(bindings.getState()).toEqual({ loading: false, loaded: false, errors });
  });

  it("should perform a simple mutation", async () => {
    let bindings = createBindings(client, () => {}, {
      mutations: {
        createAuthor: { query: CREATE_AUTHOR }
      }
    });

    let props = bindings.getState();

    let variables = { name: "Bart" };

    let { data } = await mockQueryRequest({ query: CREATE_AUTHOR.query, variables });

    let { data: mutationData } = await props.createAuthor(variables);

    expect(mutationData).toEqual(data);
  });

  it("should perform mutation with a cache update", async () => {
    await mockQueryRequest(AUTHORS);

    let mutations = {
      createAuthor: {
        query: CREATE_AUTHOR,
        update: ({ authors }, data) => ({
          authors: [data.createAuthor, ...authors]
        })
      }
    };

    let update = jest.spyOn(mutations.createAuthor, "update");

    let bindings = createBindings(client, () => {}, { query: AUTHORS, mutations });

    let props = bindings.getState();

    expect(typeof props.createAuthor).toBe("function");

    await bindings.load();

    let variables = { name: "Homer" };

    let { data } = await mockQueryRequest({
      query: CREATE_AUTHOR.query,
      variables
    });

    let { authors } = bindings.getState();

    await props.createAuthor(variables);

    expect(update).toHaveBeenCalledWith({ authors }, data);
  });

  it("should perform optimistic update", async () => {
    await mockQueryRequest(AUTHORS);

    let mutations = {
      createAuthor: {
        query: CREATE_AUTHOR,
        optimisticUpdate: ({ authors }, variables) => ({
          authors: [{ ...variables, id: "tempID" }, ...authors]
        }),
        update: ({ authors }, data) => ({
          authors: authors.map((p) => (p.id === "tempID" ? data.createAuthor : p))
        })
      }
    };

    let optimisticUpdate = jest.spyOn(mutations.createAuthor, "optimisticUpdate");
    let update = jest.spyOn(mutations.createAuthor, "update");

    let bindings = createBindings(client, () => {}, { query: AUTHORS, mutations });

    let props = bindings.getState();

    expect(typeof props.createAuthor).toBe("function");

    await bindings.load();

    let variables = { name: "Peter" };

    let { data } = await mockQueryRequest({
      query: CREATE_AUTHOR.query,
      variables
    });

    let { authors } = bindings.getState();

    let createAuthorPromise = props.createAuthor(variables);

    expect(optimisticUpdate).toHaveBeenCalledWith({ authors }, variables);

    let { authors: modifiedAuthors } = bindings.getState();

    await createAuthorPromise;

    expect(update).toHaveBeenCalledWith({ authors: modifiedAuthors }, data);
  });

  it("should update if query objects has less keys then nextObjects", async () => {
    let { query } = CREATE_AUTHOR;
    let {
      data: { createAuthor: author }
    } = await mockQueryRequest<CreateAuthorMutation>({ query, variables: { name: "gustav" } });
    let { data } = await mockQueryRequest<AuthorsQuery>(AUTHORS);

    client.write(AUTHORS, data);

    let renderFn = jest.fn();

    let bindings = createBindings(client, renderFn, {
      query: AUTHORS,
      mutations: {
        removeAuthor: {
          query: DELETE_AUTHOR,
          optimisticUpdate: ({ authors }, { id }) => ({
            authors: authors.filter((author) => author.id !== id)
          })
        }
      }
    });

    let { removeAuthor } = bindings.getState();

    let variables = { id: author.id };

    await removeAuthor(variables);

    expect(renderFn).toHaveBeenCalled();
  });

  it("should update if query objects is modified", async () => {
    let { query } = CREATE_AUTHOR;
    let {
      data: { createAuthor: author }
    } = await mockQueryRequest<CreateAuthorMutation>({
      query,
      variables: { name: "sven" }
    });
    let { data } = await mockQueryRequest<AuthorsQuery>(AUTHORS);

    client.write(AUTHORS, data);

    let mutations = {
      updateAuthor: {
        query: UPDATE_AUTHOR,
        optimisticUpdate: ({ authors }, variables) => ({
          authors: authors.map((author) => (author.id === variables.id ? variables : author))
        })
      }
    };

    let renderFn = jest.fn();

    let bindings = createBindings(client, renderFn, { query: AUTHORS, mutations });

    let { updateAuthor } = bindings.getState();

    let variables = { ...author, name: "johan" };

    await mockQueryRequest({ query: UPDATE_AUTHOR.query, variables });

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

    let mutations = {
      createAuthor: {
        query: CREATE_AUTHOR,
        optimisticUpdate: ({ authors }, variables: Author) => ({
          authors: [{ ...variables, id: "tempID" }, ...authors]
        }),
        update: ({ authors }, data: CreateAuthorMutation) => ({
          authors: authors.map((author) => (author.id === "tempID" ? data.createAuthor : author))
        })
      },
      updateAuthor: {
        query: UPDATE_AUTHOR,
        optimisticUpdate: ({ authors }, variables: Author) => ({
          authors: authors.map((author) => (author.id === variables.id ? variables : author))
        })
      },
      deleteAuthor: {
        query: DELETE_AUTHOR,
        optimisticUpdate: ({ authors }, variables: Author) => ({
          authors: authors.map((author) => (author.id === variables.id ? variables : author))
        })
      }
    };

    let renderFn = jest.fn();
    let bindings = createBindings(client, renderFn, { query: AUTHORS, mutations });
    let props = bindings.getState();

    let variables = { name: "mikel" };
    let { data } = await mockQueryRequest<CreateAuthorMutation>({
      query: CREATE_AUTHOR.query,
      variables
    });
    expect(await mockQueryRequest({ query: CREATE_AUTHOR.query, variables })).toEqual(
      await props.createAuthor(variables)
    );

    variables = { ...data.createAuthor, name: "miguel" };
    expect(await mockQueryRequest({ query: UPDATE_AUTHOR.query, variables })).toEqual(
      await props.updateAuthor(variables)
    );

    variables = data.createAuthor;
    expect(await mockQueryRequest({ query: DELETE_AUTHOR.query, variables })).toEqual(
      await props.deleteAuthor(data.createAuthor)
    );
  });

  it("should update variables when new variables are passed", async () => {
    let {
      data: { authors }
    } = await mockQueryRequest(AUTHORS);

    let [author1, author2] = authors;
    let author1Variables = { id: author1.id };
    let author2Variables = { id: author2.id };

    let bindings = createBindings(client, () => {}, { query: AUTHOR, variables: author1Variables });

    await mockQueryRequest({ query: AUTHOR.query, variables: author1Variables });
    await bindings.load();
    expect(bindings.getState().author).toEqual(author1);
    expect(client.read(AUTHOR, author1Variables).data.author).toEqual(author1);

    await mockQueryRequest({ query: AUTHOR.query, variables: author2Variables });
    await bindings.load(author2Variables);
    expect(bindings.getState().author).toEqual(author2);
    expect(client.read(AUTHOR, author2Variables).data.author).toEqual(author2);
  });
});
