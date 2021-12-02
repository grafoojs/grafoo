/**
 * @jest-environment jsdom
 */

import fetch from "node-fetch";
import * as React from "react";
import createClient, { GrafooClient } from "@grafoo/core";
import {
  mockQueryRequest,
  createTransport,
  AuthorEdge,
  AuthorConnection
} from "@grafoo/test-utils";
import { renderHook, act } from "@testing-library/react-hooks";

import { GrafooProvider, useGrafoo } from "../src";
import {
  AuthorsQuery,
  PostsAndAuthorsQuery,
  AUTHOR,
  AUTHORS,
  CREATE_AUTHOR,
  POSTS_AND_AUTHORS
} from "./queries";

// @ts-ignore
globalThis.fetch = fetch;

describe("@grafoo/react", () => {
  let client: GrafooClient;
  let wrapper: React.FC;

  beforeEach(() => {
    jest.resetAllMocks();
    let transport = createTransport("https://some.graphql.api/");
    client = createClient({ transport, idFields: ["id"] });
    wrapper = (props) => <GrafooProvider client={client}>{props.children}</GrafooProvider>;
  });

  it("should not crash if a query is not given as prop", () => {
    expect(() => renderHook(() => useGrafoo({}), { wrapper })).not.toThrow();
  });

  it("should not fetch a query if skip prop is set to true", async () => {
    let spy = jest.spyOn(window, "fetch");

    renderHook(() => useGrafoo({ query: AUTHORS, skip: true }), { wrapper });

    expect(spy).not.toHaveBeenCalled();
  });

  it("should trigger listen on client instance", async () => {
    await mockQueryRequest(AUTHORS);

    let spy = jest.spyOn(client, "listen");

    renderHook(() => useGrafoo({ query: AUTHORS, skip: true }), { wrapper });

    expect(spy).toHaveBeenCalled();
  });

  it("should execute render with default render argument", () => {
    let { result } = renderHook(() => useGrafoo({ query: AUTHORS, skip: true }), { wrapper });

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

  it("should render if skip changed value to false", async () => {
    let { data } = await mockQueryRequest<AuthorsQuery>(AUTHORS);
    let { result, rerender, waitForNextUpdate } = renderHook<{ skip: boolean }, any>(
      ({ skip }) => useGrafoo({ query: AUTHORS, skip }),
      {
        wrapper,
        initialProps: {
          skip: true
        }
      }
    );

    expect(result.current).toEqual({ loading: false, loaded: false });
    rerender({ skip: false });
    expect(result.current).toEqual({ loading: true, loaded: false });
    await waitForNextUpdate();
    expect(result.current).toEqual({ loading: false, loaded: true, ...data });
  });

  it("should rerender if variables prop has changed", async () => {
    let {
      data: { authors }
    } = await mockQueryRequest<AuthorsQuery>(AUTHORS);
    let author1 = authors.edges[0];
    let author2 = authors.edges[1];

    await mockQueryRequest(AUTHOR, { id: author1.node.id });
    let { result, rerender, waitForNextUpdate } = renderHook<{ id: string }, any>(
      ({ id }) => useGrafoo({ query: AUTHOR, variables: { id } }),
      {
        wrapper,
        initialProps: {
          id: author1.node.id
        }
      }
    );

    expect(result.current).toEqual({ loading: true, loaded: false });
    await waitForNextUpdate();
    expect(result.current).toEqual({ loading: false, loaded: true, author: author1.node });
    await mockQueryRequest(AUTHOR, { id: author2.node.id });
    rerender({ id: author2.node.id });
    expect(result.current).toEqual({ loading: true, loaded: true, author: author1.node });
    await waitForNextUpdate();
    expect(result.current).toEqual({ loading: false, loaded: true, author: author2.node });
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
    let variables = { input: { name: "Bart" } };

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
                authors: {
                  edges: [
                    ...authors.edges,
                    { node: { ...variables.input, id: "tempID" } } as AuthorEdge
                  ]
                } as AuthorConnection
              }),
              update: ({ authors }, data) => ({
                authors: {
                  edges: authors.edges.map((p) =>
                    p.node.id === "tempID" ? { ...p, node: data.createAuthor.author } : p
                  )
                } as AuthorConnection
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

    let variables = { input: { name: "Homer" } };
    await mockQueryRequest(CREATE_AUTHOR, variables);
    act(() => {
      result.current.createAuthor(variables);
    });

    expect(result.current.authors.edges.length).toBe(data.authors.edges.length + 1);
    let newAuthor = result.current.authors.edges.find((a) => a.node.id === "tempID");
    expect(newAuthor).toEqual({ node: { name: "Homer", id: "tempID" } });

    await waitForNextUpdate();

    expect(result.current.authors.edges.find((a) => a.node.id === "tempID")).toBeUndefined();
    expect(result.current.authors.edges.find((a) => a.node.name === "Homer")).toBeTruthy();
  });

  it("should reflect updates that happen outside of the component", async () => {
    let { data } = await mockQueryRequest<AuthorsQuery>(AUTHORS);

    client.write(AUTHORS, data);

    let { result } = renderHook(() => useGrafoo({ query: AUTHORS }), { wrapper });

    expect(result.current).toMatchObject({ loading: false, loaded: true, ...data });

    act(() => {
      let newAuthors: AuthorsQuery = JSON.parse(JSON.stringify(data));
      newAuthors.authors.edges.unshift({
        node: { name: "Lisa", id: "tempID" },
        cursor: "tempCursor"
      });
      client.write(AUTHORS, newAuthors);
    });

    expect(result.current.authors.edges[0].node.name).toBe("Lisa");
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
