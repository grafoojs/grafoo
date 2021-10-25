/**
 * @jest-environment jsdom
 */

import fetch from "node-fetch";
import * as React from "react";
import graphql from "@grafoo/core/tag";
import createClient, { GrafooClient } from "@grafoo/core";
import { mockQueryRequest, createTransport } from "@grafoo/test-utils";
import { renderHook, act } from "@testing-library/react-hooks";

import { GrafooProvider, useGrafoo } from "../src";

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

let SIMPLE_AUTHORS = graphql<AuthorsQuery>`
  query {
    authors {
      name
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

describe("@grafoo/react", () => {
  let client: GrafooClient;
  let wrapper: React.FC;

  beforeEach(() => {
    jest.resetAllMocks();
    let transport = createTransport("https://some.graphql.api/");
    client = createClient(transport, { idFields: ["id"] });
    wrapper = (props) => <GrafooProvider client={client}>{props.children}</GrafooProvider>;
  });

  it("should not crash if a query is not given as prop", () => {
    expect(() => renderHook(() => useGrafoo({}), { wrapper })).not.toThrow();
  });

  it("should not fetch a query if lazy prop is set to true", async () => {
    let spy = jest.spyOn(window, "fetch");

    renderHook(() => useGrafoo({ query: AUTHORS, lazy: true }), { wrapper });

    expect(spy).not.toHaveBeenCalled();
  });

  it("should trigger listen on client instance", async () => {
    await mockQueryRequest(AUTHORS);

    let spy = jest.spyOn(client, "listen");

    renderHook(() => useGrafoo({ query: AUTHORS, lazy: true }), { wrapper });

    expect(spy).toHaveBeenCalled();
  });

  it("should execute render with default render argument", () => {
    let { result } = renderHook(() => useGrafoo({ query: AUTHORS, lazy: true }), { wrapper });

    expect(result.current).toEqual({ loading: false, loaded: false });
  });

  it("should execute render with the right data if a query is specified", async () => {
    let { data } = await mockQueryRequest<AuthorsQuery>(AUTHORS);
    let { result, waitForNextUpdate } = renderHook(() => useGrafoo({ query: AUTHORS }), {
      wrapper
    });

    expect(result.current).toEqual({ loading: true, loaded: false });
    await waitForNextUpdate();
    expect(result.current).toEqual({ loading: false, loaded: true, ...data });
  });

  it("should render if lazy changed value to false", async () => {
    let { data } = await mockQueryRequest<AuthorsQuery>(AUTHORS);
    let { result, rerender, waitForNextUpdate } = renderHook<{ lazy: boolean }, any>(
      ({ lazy }) => useGrafoo({ query: AUTHORS, lazy }),
      {
        wrapper,
        initialProps: {
          lazy: true
        }
      }
    );

    expect(result.current).toEqual({ loading: false, loaded: false });
    rerender({ lazy: false });
    expect(result.current).toEqual({ loading: true, loaded: false });
    await waitForNextUpdate();
    expect(result.current).toEqual({ loading: false, loaded: true, ...data });
  });

  it("should rerender if variables prop has changed", async () => {
    let {
      data: { authors }
    } = await mockQueryRequest<AuthorsQuery>(SIMPLE_AUTHORS);
    let author1 = authors[0];
    let author2 = authors[1];

    await mockQueryRequest(AUTHOR, { id: author1.id });
    let { result, rerender, waitForNextUpdate } = renderHook<{ id: string }, any>(
      ({ id }) => useGrafoo({ query: AUTHOR, variables: { id } }),
      {
        wrapper,
        initialProps: {
          id: author1.id
        }
      }
    );

    expect(result.current).toEqual({ loading: true, loaded: false });
    await waitForNextUpdate();
    expect(result.current).toEqual({ loading: false, loaded: true, author: author1 });
    await mockQueryRequest(AUTHOR, { id: author2.id });
    rerender({ id: author2.id });
    expect(result.current).toEqual({ loading: true, loaded: true, author: author1 });
    await waitForNextUpdate();
    expect(result.current).toEqual({ loading: false, loaded: true, author: author2 });
  });

  it("should not try to load a query if it's already cached", async () => {
    let { data } = await mockQueryRequest<AuthorsQuery>(AUTHORS);
    client.write(AUTHORS, data);
    jest.resetAllMocks();

    let spy = jest.spyOn(client, "execute");
    let { result } = renderHook(() => useGrafoo({ query: AUTHORS }), { wrapper });

    expect(result.current).toEqual({ loading: false, loaded: true, ...data });
    expect(spy).not.toHaveBeenCalled();
  });

  it("should handle mutations", async () => {
    let variables = { name: "Bart" };

    let data = await mockQueryRequest(CREATE_AUTHOR, variables);
    let { result } = renderHook(
      () => useGrafoo({ mutations: { createAuthor: { query: CREATE_AUTHOR } } }),
      { wrapper }
    );

    let res = await result.current.createAuthor(variables);
    expect(res).toEqual(data);
  });

  it("should handle mutations with cache update", async () => {
    let { data } = await mockQueryRequest<AuthorsQuery>(AUTHORS);
    let { result, waitForNextUpdate } = renderHook(
      () =>
        useGrafoo({
          query: AUTHORS,
          mutations: {
            createAuthor: {
              query: CREATE_AUTHOR,
              optimisticUpdate: ({ authors }, variables) => ({
                authors: [...authors, { ...variables, id: "tempID" }]
              }),
              update: ({ authors }, data) => ({
                authors: authors.map((a) => (a.id === "tempID" ? data.createAuthor : a))
              })
            }
          }
        }),
      { wrapper }
    );

    expect(result.current).toMatchObject({ loading: true, loaded: false });
    expect(typeof result.current.createAuthor).toBe("function");

    await waitForNextUpdate();

    expect(result.current).toMatchObject({ loading: false, loaded: true, ...data });

    let variables = { name: "Homer" };
    await mockQueryRequest(CREATE_AUTHOR, variables);
    act(() => {
      result.current.createAuthor(variables);
    });

    expect(result.current.authors.length).toBe(data.authors.length + 1);
    let newAuthor = result.current.authors.find((a) => a.id === "tempID");
    expect(newAuthor).toEqual({ name: "Homer", id: "tempID" });

    await waitForNextUpdate();

    expect(result.current.authors.find((a) => a.id === "tempID")).toBeUndefined();
    expect(result.current.authors.find((a) => a.name === "Homer")).toBeTruthy();
  });

  it("should reflect updates that happen outside of the component", async () => {
    let { data } = await mockQueryRequest<AuthorsQuery>(AUTHORS);

    client.write(AUTHORS, data);

    let { result } = renderHook(() => useGrafoo({ query: AUTHORS }), { wrapper });

    expect(result.current).toMatchObject({ loading: false, loaded: true, ...data });

    act(() => {
      client.write(AUTHORS, {
        authors: data.authors.map((a, i) => (!i ? { ...a, name: "Lisa" } : a))
      });
    });

    expect(result.current.authors[0].name).toBe("Lisa");
  });

  it("should not try to fetch a query data if it's already cached", async () => {
    let { data } = await mockQueryRequest<PostsAndAuthorsQuery>(POSTS_AND_AUTHORS);

    client.write(POSTS_AND_AUTHORS, data);

    let { result } = renderHook(() => useGrafoo({ query: AUTHORS }), { wrapper });

    let spy = jest.spyOn(client, "execute");

    expect(result.current).toEqual({ authors: data.authors, loading: false, loaded: true });
    expect(spy).not.toHaveBeenCalled();
  });
});
