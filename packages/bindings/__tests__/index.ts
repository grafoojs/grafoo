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

let AUTHORS = graphql`
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

let AUTHOR = graphql`
  query($id: ID!) {
    author(id: $id) {
      name
      posts {
        title
        body
      }
    }
  }
`;

let POSTS_AND_AUTHORS = graphql`
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

let CREATE_AUTHOR = graphql`
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

let DELETE_AUTHOR = graphql`
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

let UPDATE_AUTHOR = graphql`
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
    let transport = createTransport("https://some.graphql.api/");
    client = createClient(transport, { idFields: ["id"] });
  });

  it("should be evocable given the minimal props", () => {
    let bindings;
    expect(() => (bindings = createBindings(client, {}, () => void 0))).not.toThrow();

    Object.keys(bindings).forEach((fn) => {
      expect(typeof bindings[fn]).toBe("function");
    });

    expect(bindings.unbind()).toBeUndefined();
  });

  it("should not provide any data if no query or mutation is given", () => {
    let bindings = createBindings(client, {}, () => void 0);

    let props = bindings.getState();

    expect(props).toEqual({ client });
  });

  it("should execute a query", async () => {
    let { data } = await mockQueryRequest<Authors>(AUTHORS);

    let renderFn = jest.fn();

    let bindings = createBindings<Authors>(client, { query: AUTHORS }, renderFn);

    expect(bindings.getState()).toMatchObject({ loaded: false, loading: true });

    await bindings.load();

    expect(bindings.getState()).toMatchObject({ ...data, loaded: true, loading: false });
  });

  it("should notify a loading state", async () => {
    let { data } = await mockQueryRequest<Authors>(AUTHORS);

    let renderFn = jest.fn();

    let bindings = createBindings<Authors>(client, { query: AUTHORS }, renderFn);

    await bindings.load();

    expect(renderFn).toHaveBeenCalledTimes(1);
    expect(bindings.getState()).toMatchObject({ ...data, loaded: true, loading: false });

    let reloadPromise = bindings.load();

    expect(bindings.getState().loading).toBe(true);

    await reloadPromise;

    expect(bindings.getState().loading).toBe(false);
  });

  it("should provide the data if the query is already cached", async () => {
    let { data } = await mockQueryRequest<Authors>(AUTHORS);

    client.write(AUTHORS, data);

    let bindings = createBindings<Authors>(client, { query: AUTHORS }, () => void 0);

    expect(bindings.getState()).toMatchObject({ ...data, loaded: true, loading: false });
  });

  it("should provide the data if a query is partialy cached", async () => {
    let { data } = await mockQueryRequest<Authors>(AUTHORS);

    client.write(AUTHORS, data);

    let bindings = createBindings<Authors>(client, { query: POSTS_AND_AUTHORS }, () => void 0);

    expect(bindings.getState()).toMatchObject({ ...data, loaded: false, loading: true });
  });

  it("should trigger updater function if the cache has been updated", async () => {
    let { data } = await mockQueryRequest<Authors>(AUTHORS);

    let renderFn = jest.fn();

    let bindings = createBindings<Authors>(client, { query: AUTHORS }, renderFn);

    client.write(AUTHORS, data);

    expect(renderFn).toHaveBeenCalled();
    expect(bindings.getState()).toMatchObject(data);
  });

  it("should provide the state for a cached query", async () => {
    let { data } = await mockQueryRequest<Authors>(AUTHORS);

    client.write(AUTHORS, data);

    let renderFn = jest.fn();

    let bindings = createBindings<Authors>(client, { query: AUTHORS }, renderFn);

    expect(bindings.getState()).toMatchObject(data);
  });

  it("should stop updating if unbind has been called", async () => {
    let { data } = await mockQueryRequest<Authors>(AUTHORS);

    let renderFn = jest.fn();

    let bindings = createBindings<Authors>(client, { query: AUTHORS }, renderFn);

    await bindings.load();

    bindings.unbind();

    client.write(AUTHORS, {
      authors: data.authors.map((a, i) => (!i ? { ...a, name: "Homer" } : a)),
    });

    expect(client.read<Authors>(AUTHORS).data.authors[0].name).toBe("Homer");
    expect(renderFn).toHaveBeenCalledTimes(1);
    expect(bindings.getState()).toMatchObject(data);
  });

  it("should provide errors on bad request", async () => {
    let FailAuthors = { ...AUTHORS, query: AUTHORS.query.substr(1) };

    let { errors } = await mockQueryRequest(FailAuthors);

    let renderFn = jest.fn();

    let bindings = createBindings(client, { query: FailAuthors }, renderFn);

    await bindings.load();

    expect(renderFn).toHaveBeenCalledTimes(1);
    expect(bindings.getState()).toMatchObject({ errors });
  });

  it("should perform a simple mutation", async () => {
    interface Mutations {
      createAuthor: CreateAuthor;
    }

    let mutations: GrafooMutations<Author, Mutations> = { createAuthor: { query: CREATE_AUTHOR } };

    let bindings = createBindings(client, { mutations }, () => void 0);

    let props = bindings.getState();

    let variables = { name: "Bart" };

    let { data } = await mockQueryRequest({ query: CREATE_AUTHOR.query, variables });

    let { data: mutationData } = await props.createAuthor(variables);

    expect(mutationData).toEqual(data);
  });

  it("should perform mutation with a cache update", async () => {
    await mockQueryRequest<Authors>(AUTHORS);

    interface Mutations {
      createAuthor: CreateAuthor;
    }

    let mutations: GrafooMutations<Authors, Mutations> = {
      createAuthor: {
        query: CREATE_AUTHOR,
        update: ({ authors }, data) => ({
          authors: [data.createAuthor, ...authors],
        }),
      },
    };

    let update = jest.spyOn(mutations.createAuthor, "update");

    let bindings = createBindings(client, { query: AUTHORS, mutations }, () => void 0);

    let props = bindings.getState();

    expect(typeof props.createAuthor).toBe("function");

    await bindings.load();

    let variables = { name: "Homer" };

    let { data } = await mockQueryRequest<CreateAuthor>({ query: CREATE_AUTHOR.query, variables });

    let { authors } = bindings.getState();

    await props.createAuthor(variables);

    expect(update).toHaveBeenCalledWith({ authors }, data);
  });

  it("should perform optimistic update", async () => {
    await mockQueryRequest(AUTHORS);

    interface Mutations {
      createAuthor: CreateAuthor;
    }

    let mutations: GrafooMutations<Authors, Mutations> = {
      createAuthor: {
        query: CREATE_AUTHOR,
        optimisticUpdate: ({ authors }, variables: Author) => ({
          authors: [{ ...variables, id: "tempID" }, ...authors],
        }),
        update: ({ authors }, data) => ({
          authors: authors.map((p) => (p.id === "tempID" ? data.createAuthor : p)),
        }),
      },
    };

    let optimisticUpdate = jest.spyOn(mutations.createAuthor, "optimisticUpdate");
    let update = jest.spyOn(mutations.createAuthor, "update");

    let bindings = createBindings(client, { query: AUTHORS, mutations }, () => void 0);

    let props = bindings.getState();

    expect(typeof props.createAuthor).toBe("function");

    await bindings.load();

    let variables = { name: "Peter" };

    let { data } = await mockQueryRequest<CreateAuthor>({ query: CREATE_AUTHOR.query, variables });

    let { authors } = bindings.getState();

    let createAuthorPromise = props.createAuthor(variables);

    expect(optimisticUpdate).toHaveBeenCalledWith({ authors }, variables);

    let { authors: modifiedAuthors } = bindings.getState();

    await createAuthorPromise;

    expect(update).toHaveBeenCalledWith({ authors: modifiedAuthors }, data);
  });

  it("should update if query objects has less keys then nextObjects", async () => {
    let { query } = CREATE_AUTHOR;
    let author = (await mockQueryRequest<CreateAuthor>({ query, variables: { name: "gustav" } }))
      .data.createAuthor;
    let { data } = await mockQueryRequest(AUTHORS);

    client.write(AUTHORS, data);

    interface Mutations {
      removeAuthor: DeleteAuthor;
    }

    let mutations: GrafooMutations<Authors, Mutations> = {
      removeAuthor: {
        query: DELETE_AUTHOR,
        optimisticUpdate: ({ authors }, { id }: Author) => ({
          authors: authors.filter((author) => author.id !== id),
        }),
      },
    };

    let renderFn = jest.fn();

    let bindings = createBindings(client, { query: AUTHORS, mutations }, renderFn);

    let { removeAuthor } = bindings.getState();

    let variables = { id: author.id };

    await removeAuthor(variables);

    expect(renderFn).toHaveBeenCalled();
  });

  it("should update if query objects is modified", async () => {
    let { query } = CREATE_AUTHOR;
    let author = (
      await mockQueryRequest<CreateAuthor>({
        query,
        variables: { name: "sven" },
      })
    ).data.createAuthor;
    let { data } = await mockQueryRequest(AUTHORS);

    client.write(AUTHORS, data);

    interface Mutations {
      updateAuthor: UpdateAuthor;
    }

    let mutations: GrafooMutations<Authors, Mutations> = {
      updateAuthor: {
        query: UPDATE_AUTHOR,
        optimisticUpdate: ({ authors }, variables: Author) => ({
          authors: authors.map((author) => (author.id === variables.id ? variables : author)),
        }),
      },
    };

    let renderFn = jest.fn();

    let bindings = createBindings(client, { query: AUTHORS, mutations }, renderFn);

    let { updateAuthor } = bindings.getState();

    let variables = { ...author, name: "johan" };

    await mockQueryRequest({ query: UPDATE_AUTHOR.query, variables });

    await updateAuthor(variables);

    expect(renderFn).toHaveBeenCalled();
  });

  it("should not update if query objects is not modified", async () => {
    let { data } = await mockQueryRequest(AUTHORS);

    client.write(AUTHORS, data);

    let renderFn = jest.fn();

    createBindings(client, { query: AUTHORS }, renderFn);

    client.write(AUTHORS, data);

    expect(renderFn).not.toHaveBeenCalled();
  });

  it("should accept multiple mutations", async () => {
    let { data } = await mockQueryRequest(AUTHORS);
    client.write(AUTHORS, data);

    interface Mutations {
      createAuthor: CreateAuthor;
      updateAuthor: UpdateAuthor;
      deleteAuthor: DeleteAuthor;
    }

    let mutations: GrafooMutations<Authors, Mutations> = {
      createAuthor: {
        query: CREATE_AUTHOR,
        optimisticUpdate: ({ authors }, variables: Author) => ({
          authors: [{ ...variables, id: "tempID" }, ...authors],
        }),
        update: ({ authors }, data: CreateAuthor) => ({
          authors: authors.map((author) => (author.id === "tempID" ? data.createAuthor : author)),
        }),
      },
      updateAuthor: {
        query: UPDATE_AUTHOR,
        optimisticUpdate: ({ authors }, variables: Author) => ({
          authors: authors.map((author) => (author.id === variables.id ? variables : author)),
        }),
      },
      deleteAuthor: {
        query: DELETE_AUTHOR,
        optimisticUpdate: ({ authors }, variables: Author) => ({
          authors: authors.map((author) => (author.id === variables.id ? variables : author)),
        }),
      },
    };

    let renderFn = jest.fn();

    let bindings = createBindings(client, { query: AUTHORS, mutations }, renderFn);
    let props = bindings.getState();

    try {
      let variables: Variables = { name: "mikel" };
      let { data } = await mockQueryRequest<CreateAuthor>({
        query: CREATE_AUTHOR.query,
        variables,
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

  it("should update variables when new variables are passed", async () => {
    let {
      data: { authors },
    } = await mockQueryRequest<Authors>(AUTHORS);

    let [author1, author2] = authors;
    let author1Variables = { id: author1.id };
    let author2Variables = { id: author2.id };

    let bindings = createBindings<{ author: Author }>(
      client,
      { query: AUTHOR, variables: author1Variables },
      () => {}
    );

    await mockQueryRequest({ query: AUTHOR.query, variables: author1Variables });
    await bindings.load();
    expect(bindings.getState().author).toMatchObject(author1);
    expect(client.read<{ author: Author }>(AUTHOR, author1Variables).data.author).toEqual(author1);

    await mockQueryRequest({ query: AUTHOR.query, variables: author2Variables });
    await bindings.load(author2Variables);
    expect(bindings.getState().author).toMatchObject(author2);
    expect(client.read<{ author: Author }>(AUTHOR, author2Variables).data.author).toEqual(author2);
  });
});
