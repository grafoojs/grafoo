import createBindings from "../src";
import graphql from "@grafoo/core/tag";
import createClient from "@grafoo/core";
import { GrafooClient, GrafooMutations, Variables } from "@grafoo/types";
import { mockQueryRequest } from "@grafoo/test-utils";
import createTransport from "@grafoo/http-transport";

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

interface DeleteAuthor {
  deleteAuthor: {
    name: string;
    id: string;
    __typename: string;
    posts?: Array<Post>;
  };
}

interface UpdateAuthor {
  updateAuthor: {
    name: string;
    id: string;
    __typename: string;
    posts?: Array<Post>;
  };
}

const AUTHORS = graphql`
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

const POSTS_AND_AUTHORS = graphql`
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

const CREATE_AUTHOR = graphql`
  mutation($name: String!) {
    createAuthor(name: $name) {
      name
      posts {
        title
        body
      }
    }
  }
`;

const DELETE_AUTHOR = graphql`
  mutation($id: ID!) {
    deleteAuthor(id: $id) {
      name
      posts {
        title
        body
      }
    }
  }
`;

const UPDATE_AUTHOR = graphql`
  mutation($id: ID!, $name: String) {
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
    const transport = createTransport("https://some.graphql.api/");
    client = createClient(transport, { idFields: ["id"] });
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
    const { data } = await mockQueryRequest(AUTHORS);

    const renderFn = jest.fn();

    const bindings = createBindings<Authors>(client, { query: AUTHORS }, renderFn);

    expect(bindings.getState()).toMatchObject({ loaded: false, loading: true });

    await bindings.load();

    expect(renderFn).toHaveBeenCalledTimes(1);
    expect(bindings.getState()).toMatchObject({ ...data, loaded: true, loading: false });
  });

  it("should notify a loading state", async () => {
    const { data } = await mockQueryRequest(AUTHORS);

    const renderFn = jest.fn();

    const bindings = createBindings<Authors>(client, { query: AUTHORS }, renderFn);

    await bindings.load();

    expect(renderFn).toHaveBeenCalledTimes(1);
    expect(bindings.getState()).toMatchObject({ ...data, loaded: true, loading: false });

    const reloadPromise = bindings.load();

    expect(bindings.getState().loading).toBe(true);

    await reloadPromise;

    expect(bindings.getState().loading).toBe(false);
  });

  it("should provide the data if the query is already cached", async () => {
    const { data } = await mockQueryRequest(AUTHORS);

    client.write(AUTHORS, data);

    const bindings = createBindings<Authors>(client, { query: AUTHORS }, () => void 0);

    expect(bindings.getState()).toMatchObject({ ...data, loaded: true, loading: false });
  });

  it("should provide the data if a query is partialy cached", async () => {
    const { data } = await mockQueryRequest(AUTHORS);

    client.write(AUTHORS, data);

    const bindings = createBindings<Authors>(client, { query: POSTS_AND_AUTHORS }, () => void 0);

    expect(bindings.getState()).toMatchObject({ ...data, loaded: false, loading: true });
  });

  it("should trigger updater function if the cache has been updated", async () => {
    const { data } = await mockQueryRequest(AUTHORS);

    const renderFn = jest.fn();

    const bindings = createBindings<Authors>(client, { query: AUTHORS }, renderFn);

    client.write(AUTHORS, data);

    expect(renderFn).toHaveBeenCalled();
    expect(bindings.getState()).toMatchObject(data);
  });

  it("should provide the state for a cached query", async () => {
    const { data } = await mockQueryRequest(AUTHORS);

    client.write(AUTHORS, data);

    const renderFn = jest.fn();

    const bindings = createBindings<Authors>(client, { query: AUTHORS }, renderFn);

    expect(bindings.getState()).toMatchObject(data);
  });

  it("should stop updating if unbind has been called", async () => {
    const { data } = await mockQueryRequest<Authors>(AUTHORS);

    const renderFn = jest.fn();

    const bindings = createBindings<Authors>(client, { query: AUTHORS }, renderFn);

    await bindings.load();

    bindings.unbind();

    client.write(AUTHORS, {
      authors: data.authors.map((a, i) => (!i ? { ...a, name: "Homer" } : a))
    });

    expect(client.read<Authors>(AUTHORS).data.authors[0].name).toBe("Homer");
    expect(renderFn).toHaveBeenCalledTimes(1);
    expect(bindings.getState()).toMatchObject(data);
  });

  it("should provide errors on bad request", async () => {
    const FailAuthors = { ...AUTHORS, query: AUTHORS.query.substr(1) };

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

    const mutations: GrafooMutations<{}, Mutations> = { createAuthor: { query: CREATE_AUTHOR } };

    const bindings = createBindings(client, { mutations }, () => void 0);

    const props = bindings.getState();

    const variables = { name: "Bart" };

    const { data } = await mockQueryRequest({ query: CREATE_AUTHOR.query, variables });

    const { data: mutationData } = await props.createAuthor(variables);

    expect(mutationData).toEqual(data);
  });

  it("should perform mutation with a cache update", async () => {
    await mockQueryRequest(AUTHORS);

    interface Mutations {
      createAuthor: CreateAuthor;
    }

    const mutations: GrafooMutations<Authors, Mutations> = {
      createAuthor: {
        query: CREATE_AUTHOR,
        update: ({ authors }, data) => ({
          authors: [data.createAuthor, ...authors]
        })
      }
    };

    const update = jest.spyOn(mutations.createAuthor, "update");

    const bindings = createBindings(client, { query: AUTHORS, mutations }, () => void 0);

    const props = bindings.getState();

    expect(typeof props.createAuthor).toBe("function");

    await bindings.load();

    const variables = { name: "Homer" };

    const { data } = await mockQueryRequest({ query: CREATE_AUTHOR.query, variables });

    const { authors } = bindings.getState();

    await props.createAuthor(variables);

    expect(update).toHaveBeenCalledWith({ authors }, data);
  });

  it("should perform optimistic update", async () => {
    await mockQueryRequest(AUTHORS);

    interface Mutations {
      createAuthor: CreateAuthor;
    }

    const mutations: GrafooMutations<Authors, Mutations> = {
      createAuthor: {
        query: CREATE_AUTHOR,
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

    const bindings = createBindings(client, { query: AUTHORS, mutations }, () => void 0);

    const props = bindings.getState();

    expect(typeof props.createAuthor).toBe("function");

    await bindings.load();

    const variables = { name: "Peter" };

    const { data } = await mockQueryRequest({ query: CREATE_AUTHOR.query, variables });

    const { authors } = bindings.getState();

    const createAuthorPromise = props.createAuthor(variables);

    expect(optimisticUpdate).toHaveBeenCalledWith({ authors }, variables);

    const { authors: modifiedAuthors } = bindings.getState();

    await createAuthorPromise;

    expect(update).toHaveBeenCalledWith({ authors: modifiedAuthors }, data);
  });

  it("should update if query objects has less keys then nextObjects", async () => {
    const { query } = CREATE_AUTHOR;
    const author = (await mockQueryRequest<CreateAuthor>({ query, variables: { name: "gustav" } }))
      .data.createAuthor;
    const { data } = await mockQueryRequest(AUTHORS);

    client.write(AUTHORS, data);

    interface Mutations {
      removeAuthor: DeleteAuthor;
    }

    const mutations: GrafooMutations<Authors, Mutations> = {
      removeAuthor: {
        query: DELETE_AUTHOR,
        optimisticUpdate: ({ authors }, { id }: Author) => ({
          authors: authors.filter(author => author.id !== id)
        })
      }
    };

    const renderFn = jest.fn();

    const bindings = createBindings(client, { query: AUTHORS, mutations }, renderFn);

    const { removeAuthor } = bindings.getState();

    const variables = { id: author.id };

    await removeAuthor(variables);

    expect(renderFn).toHaveBeenCalled();
  });

  it("should update if query objects is modified", async () => {
    const { query } = CREATE_AUTHOR;
    const author = (await mockQueryRequest<CreateAuthor>({
      query,
      variables: { name: "sven" }
    })).data.createAuthor;
    const { data } = await mockQueryRequest(AUTHORS);

    client.write(AUTHORS, data);

    interface Mutations {
      updateAuthor: UpdateAuthor;
    }

    const mutations: GrafooMutations<Authors, Mutations> = {
      updateAuthor: {
        query: UPDATE_AUTHOR,
        optimisticUpdate: ({ authors }, variables: Author) => ({
          authors: authors.map(author => (author.id === variables.id ? variables : author))
        })
      }
    };

    const renderFn = jest.fn();

    const bindings = createBindings(client, { query: AUTHORS, mutations }, renderFn);

    const { updateAuthor } = bindings.getState();

    const variables = { ...author, name: "johan" };

    await mockQueryRequest({ query: UPDATE_AUTHOR.query, variables });

    await updateAuthor(variables);

    expect(renderFn).toHaveBeenCalled();
  });

  it("should not update if query objects is not modified", async () => {
    const { data } = await mockQueryRequest(AUTHORS);

    client.write(AUTHORS, data);

    const renderFn = jest.fn();

    createBindings(client, { query: AUTHORS }, renderFn);

    client.write(AUTHORS, data);

    expect(renderFn).not.toHaveBeenCalled();
  });

  it("should accept multiple mutations", async () => {
    const { data } = await mockQueryRequest(AUTHORS);
    client.write(AUTHORS, data);

    interface Mutations {
      createAuthor: CreateAuthor;
      updateAuthor: UpdateAuthor;
      deleteAuthor: DeleteAuthor;
    }

    const mutations: GrafooMutations<Authors, Mutations> = {
      createAuthor: {
        query: CREATE_AUTHOR,
        optimisticUpdate: ({ authors }, variables: Author) => ({
          authors: [{ ...variables, id: "tempID" }, ...authors]
        }),
        update: ({ authors }, data: CreateAuthor) => ({
          authors: authors.map(author => (author.id === "tempID" ? data.createAuthor : author))
        })
      },
      updateAuthor: {
        query: UPDATE_AUTHOR,
        optimisticUpdate: ({ authors }, variables: Author) => ({
          authors: authors.map(author => (author.id === variables.id ? variables : author))
        })
      },
      deleteAuthor: {
        query: DELETE_AUTHOR,
        optimisticUpdate: ({ authors }, variables: Author) => ({
          authors: authors.map(author => (author.id === variables.id ? variables : author))
        })
      }
    };

    const renderFn = jest.fn();

    const bindings = createBindings(client, { query: AUTHORS, mutations }, renderFn);
    const props = bindings.getState();

    try {
      let variables: Variables = { name: "mikel" };
      let { data } = await mockQueryRequest<CreateAuthor>({
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
    } catch (err) {
      console.error(err);
    }
  });
});
