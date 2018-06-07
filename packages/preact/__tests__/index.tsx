import createClient from "@grafoo/core";
import { Authors, CreateAuthor, mockQueryRequest, PostsAndAuthors } from "@grafoo/test-utils";
import { ClientInstance, GrafooMutation } from "@grafoo/types";
import { h } from "preact";
import { render } from "preact-render-spy";
import { Consumer, Provider } from "../src";

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

interface CreateAuthor {
  createAuthor: Author;
}

interface Authors {
  authors: Author[];
}

describe("@grafoo/preact", () => {
  let client: ClientInstance;

  beforeEach(() => {
    jest.resetAllMocks();

    client = createClient("https://some.graphql.api/", { idFields: ["id"] });
  });

  describe("<Provider />", () => {
    it("should provide the client in it's context", done => {
      const Comp = ({}, context) => {
        expect(context.client).toBe(client);

        return null;
      };

      render(
        <Provider client={client}>
          <Comp />
        </Provider>
      );

      done();
    });
  });

  describe("<Consumer />", () => {
    it("should not crash if a query is not given as prop", () => {
      expect(() =>
        render(
          <Provider client={client}>
            <Consumer>{() => null}</Consumer>
          </Provider>
        )
      ).not.toThrow();
    });

    it("should not fetch a query if skip prop is set to true", async () => {
      await mockQueryRequest(Authors);

      const spy = jest.spyOn(window, "fetch");

      render(
        <Provider client={client}>
          <Consumer query={Authors} skip>
            {() => null}
          </Consumer>
        </Provider>
      );

      expect(spy).not.toHaveBeenCalled();
    });

    it("should trigger listen on client instance", async () => {
      await mockQueryRequest(Authors);

      const spy = jest.spyOn(client, "listen");

      render(
        <Provider client={client}>
          <Consumer query={Authors} skip>
            {() => null}
          </Consumer>
        </Provider>
      );

      expect(spy).toHaveBeenCalled();
    });

    it("should not crash on unmount", () => {
      const ctx = render(
        <Provider client={client}>
          <Consumer query={Authors} skip>
            {() => null}
          </Consumer>
        </Provider>
      );

      expect(() => ctx.render(null)).not.toThrow();
    });

    it("should execute render with default render argument", () => {
      const mockRender = jest.fn();

      render(
        <Provider client={client}>
          <Consumer query={Authors} skip>
            {mockRender}
          </Consumer>
        </Provider>
      );

      expect(mockRender).toHaveBeenCalledWith({ loading: true, loaded: false });
    });

    it("should execute render with the right data if a query is specified", async done => {
      const { data } = await mockQueryRequest(Authors);

      const mockRender = createMockRenderFn(done, [
        props => expect(props).toMatchObject({ loading: true, loaded: false }),
        props => expect(props).toMatchObject({ loading: false, loaded: true, ...data })
      ]);

      render(
        <Provider client={client}>
          <Consumer query={Authors}>{mockRender}</Consumer>
        </Provider>
      );
    });

    it("should not trigger a network request if the query is already cached", async done => {
      const { data } = await mockQueryRequest(Authors);

      client.write(Authors, data);

      jest.resetAllMocks();

      const spy = jest.spyOn(client, "request");

      const mockRender = createMockRenderFn(done, [
        props => expect(props).toMatchObject({ loading: false, loaded: true, ...data })
      ]);

      render(
        <Provider client={client}>
          <Consumer query={Authors}>{mockRender}</Consumer>
        </Provider>
      );

      expect(spy).not.toHaveBeenCalled();
    });

    it("should handle mutations", async done => {
      const { data } = await mockQueryRequest(Authors);

      const mockRender = createMockRenderFn(done, [
        props => {
          expect(props).toMatchObject({ loading: true, loaded: false });
          expect(typeof props.createAuthor).toBe("function");
        },
        props => {
          expect(props).toMatchObject({ loading: false, loaded: true, ...data });
          const variables = { name: "Homer" };
          mockQueryRequest({ query: CreateAuthor.query, variables }).then(() => {
            props.createAuthor(variables);
          });
        },
        props => {
          expect(props.authors.length).toBe(data.authors.length + 1);
          const newAuthor: Author = props.authors.find(a => a.id === "tempID");
          expect(newAuthor).toMatchObject({ name: "Homer", id: "tempID" });
        },
        props => {
          expect(props.authors.find(a => a.id === "tempID")).toBeUndefined();
          expect(props.authors.find(a => a.name === "Homer")).toBeTruthy();
        }
      ]);

      type CreateAuthorMutations = GrafooMutation<Authors, CreateAuthor>;

      const createAuthor: CreateAuthorMutations = {
        query: CreateAuthor,
        optimisticUpdate: ({ authors }, variables: Author) => ({
          authors: [...authors, { ...variables, id: "tempID" }]
        }),
        update: ({ authors }, { createAuthor: author }) => ({
          authors: authors.map(a => (a.id === "tempID" ? author : a))
        })
      };

      render(
        <Provider client={client}>
          <Consumer query={Authors} mutations={{ createAuthor }}>
            {mockRender}
          </Consumer>
        </Provider>
      );
    });

    it("should reflect updates that happen outside of the component", async done => {
      const { data } = await mockQueryRequest(Authors);

      client.write(Authors, data);

      const mockRender = createMockRenderFn(done, [
        props => expect(props).toMatchObject({ loading: false, loaded: true, ...data }),
        props => expect(props.authors[0].name).toBe("Homer")
      ]);

      render(
        <Provider client={client}>
          <Consumer query={Authors}>{mockRender}</Consumer>
        </Provider>
      );

      client.write(Authors, {
        authors: data.authors.map((a, i) => (!i ? { ...a, name: "Homer" } : a))
      });
    });

    it("should not trigger a network request if a query field is cached", async done => {
      const { data } = await mockQueryRequest(PostsAndAuthors);

      client.write(PostsAndAuthors, data);

      const spy = jest.spyOn(client, "request");

      const mockRender = createMockRenderFn(done, [
        props => {
          expect(props).toMatchObject({ authors: data.authors, loading: false, loaded: true });
          expect(spy).not.toHaveBeenCalled();
        }
      ]);

      render(
        <Provider client={client}>
          <Consumer query={Authors}>{mockRender}</Consumer>
        </Provider>
      );
    });
  });
});

function createMockRenderFn(done, assertionsFns) {
  let currentRender = 0;

  return props => {
    const assert = assertionsFns[currentRender];

    if (assert) assertionsFns[currentRender](props);

    if (currentRender++ === assertionsFns.length - 1) done();

    return null;
  };
}
