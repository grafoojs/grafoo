/**
 * @jest-environment jsdom
 */

import createClient from "@grafoo/core";
import graphql from "@grafoo/core/tag";
import createTransport from "@grafoo/http-transport";
import { mockQueryRequest } from "@grafoo/test-utils";
import { GrafooClient } from "@grafoo/types";
import { h, FunctionalComponent, Component } from "preact";
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

interface Authors {
  authors: Author[];
}

let AUTHOR = graphql`
  query ($id: ID!) {
    author(id: $id) {
      name
    }
  }
`;

let AUTHORS = graphql`
  {
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
  mutation ($name: String!) {
    createAuthor(name: $name) {
      name
    }
  }
`;

let POSTS_AND_AUTHORS = graphql`
  {
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

describe("@grafoo/preact", () => {
  let client: GrafooClient;

  beforeEach(() => {
    jest.resetAllMocks();

    let transport = createTransport("https://some.graphql.api/");
    client = createClient(transport, { idFields: ["id"] });
  });

  describe("<Provider />", () => {
    it("should provide the client in it's context", (done) => {
      let Comp = (_, context) => {
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
      await mockQueryRequest(AUTHORS);

      let spy = jest.spyOn(window, "fetch");

      render(
        <Provider client={client}>
          <Consumer query={AUTHORS} skip>
            {() => null}
          </Consumer>
        </Provider>
      );

      expect(spy).not.toHaveBeenCalled();
    });

    it("should trigger listen on client instance", async () => {
      await mockQueryRequest(AUTHORS);

      let spy = jest.spyOn(client, "listen");

      render(
        <Provider client={client}>
          <Consumer query={AUTHORS} skip>
            {() => null}
          </Consumer>
        </Provider>
      );

      expect(spy).toHaveBeenCalled();
    });

    it("should not crash on unmount", () => {
      let ctx = render(
        <Provider client={client}>
          <Consumer query={AUTHORS} skip>
            {() => null}
          </Consumer>
        </Provider>
      );

      expect(() => ctx.render(null)).not.toThrow();
    });

    it("should execute render with default render argument", () => {
      let mockRender = jest.fn();

      render(
        <Provider client={client}>
          <Consumer query={AUTHORS} skip>
            {mockRender}
          </Consumer>
        </Provider>
      );

      let [[call]] = mockRender.mock.calls;

      expect(call).toMatchObject({ loading: false, loaded: false });
      expect(typeof call.load).toBe("function");
    });

    it("should execute render with the right data if a query is specified", (done) => {
      mockQueryRequest<Author>(AUTHORS).then(({ data }) => {
        let mockRender = createMockRenderFn(done, [
          (props) => expect(props).toMatchObject({ loading: true, loaded: false }),
          (props) => expect(props).toMatchObject({ loading: false, loaded: true, ...data })
        ]);

        render(
          <Provider client={client}>
            <Consumer query={AUTHORS}>{mockRender}</Consumer>
          </Provider>
        );
      });
    });

    it("should render if skip changed value to true", (done) => {
      mockQueryRequest<Author>(AUTHORS).then(async ({ data }) => {
        let mockRender = createMockRenderFn(done, [
          (props) => expect(props).toMatchObject({ loading: false, loaded: false }),
          (props) => expect(props).toMatchObject({ loading: true, loaded: false }),
          (props) => expect(props).toMatchObject({ loading: false, loaded: true, ...data }),
          (props) => expect(props).toMatchObject({ loading: false, loaded: true, ...data })
        ]);

        let App: FunctionalComponent<{ skip?: boolean }> = ({ skip = false }) => (
          <Provider client={client}>
            <Consumer query={AUTHORS} skip={skip}>
              {mockRender}
            </Consumer>
          </Provider>
        );

        let ctx = render(<App skip />);

        ctx.render(<App />);

        await new Promise((resolve) => setTimeout(resolve, 10));

        ctx.render(<App />);
      });
    });

    it("should rerender if variables prop has changed", (done) => {
      mockQueryRequest<Authors>(AUTHORS).then(async ({ data }) => {
        let mock = async (variables) => {
          return (
            await mockQueryRequest<{ author: Author }>({
              query: AUTHOR.query,
              variables
            })
          ).data.author;
        };

        let firstVariables = { id: data.authors[0].id };
        let secondVariables = { id: data.authors[1].id };
        let firstAuthor = await mock(firstVariables);
        let secondAuthor;

        let mockRender = createMockRenderFn(done, [
          (props) => expect(props).toMatchObject({ loading: true, loaded: false }),
          (props) => expect(props.author).toMatchObject(firstAuthor),
          (props) =>
            expect(props).toMatchObject({ loading: true, loaded: true, author: firstAuthor }),
          (props) => expect(props.author).toMatchObject(secondAuthor)
        ]);

        class AuthorComponent extends Component {
          constructor(props, context) {
            super(props, context);

            this.state = firstVariables;

            setTimeout(async () => {
              secondAuthor = await mock(secondVariables);

              this.setState(secondVariables);
            }, 100);
          }

          render(_, variables) {
            return (
              <Consumer query={AUTHOR} variables={variables}>
                {mockRender}
              </Consumer>
            );
          }
        }

        render(
          <Provider client={client}>
            <AuthorComponent />
          </Provider>
        );
      });
    });

    it("should not trigger a network request if the query is already cached", (done) => {
      mockQueryRequest<Author>(AUTHORS).then(({ data }) => {
        client.write(AUTHORS, data);

        jest.resetAllMocks();

        let spy = jest.spyOn(client, "execute");

        let mockRender = createMockRenderFn(done, [
          (props) => expect(props).toMatchObject({ loading: false, loaded: true, ...data })
        ]);

        render(
          <Provider client={client}>
            <Consumer query={AUTHORS}>{mockRender}</Consumer>
          </Provider>
        );

        expect(spy).not.toHaveBeenCalled();
      });
    });

    it("should handle simple mutations", (done) => {
      let { query } = CREATE_AUTHOR;
      let variables = { name: "Bart" };

      mockQueryRequest({ query, variables }).then(({ data }) => {
        let mockRender = createMockRenderFn(done, [
          (props) => {
            props.createAuthor(variables).then((res) => {
              expect(res.data).toEqual(data);
            });
          }
        ]);

        render(
          <Provider client={client}>
            <Consumer mutations={{ createAuthor: { query: CREATE_AUTHOR } }}>{mockRender}</Consumer>
          </Provider>
        );
      });
    });

    it("should handle mutations with cache update", (done) => {
      mockQueryRequest<Authors>(AUTHORS).then(({ data }) => {
        let mockRender = createMockRenderFn(done, [
          (props) => {
            expect(props).toMatchObject({ loading: true, loaded: false });
            expect(typeof props.createAuthor).toBe("function");
          },
          (props) => {
            expect(props).toMatchObject({ loading: false, loaded: true, ...data });
            let variables = { name: "Homer" };
            mockQueryRequest({ query: CREATE_AUTHOR.query, variables }).then(() => {
              props.createAuthor(variables);
            });
          },
          (props) => {
            expect(props.authors.length).toBe(data.authors.length + 1);
            let newAuthor = props.authors.find((a) => a.id === "tempID");
            expect(newAuthor).toMatchObject({ name: "Homer", id: "tempID" });
          },
          (props) => {
            expect(props.authors.find((a) => a.id === "tempID")).toBeUndefined();
            expect(props.authors.find((a) => a.name === "Homer")).toBeTruthy();
          }
        ]);

        render(
          <Provider client={client}>
            <Consumer
              query={AUTHORS}
              mutations={{
                createAuthor: {
                  query: CREATE_AUTHOR,
                  optimisticUpdate: ({ authors }, variables) => ({
                    authors: [...authors, { ...variables, id: "tempID" }]
                  }),
                  update: ({ authors }, { createAuthor: author }) => ({
                    authors: authors.map((a) => (a.id === "tempID" ? author : a))
                  })
                }
              }}
            >
              {mockRender}
            </Consumer>
          </Provider>
        );
      });
    });

    it("should reflect updates that happen outside of the component", (done) => {
      mockQueryRequest<Authors>(AUTHORS).then(({ data }) => {
        client.write(AUTHORS, data);

        let mockRender = createMockRenderFn(done, [
          (props) => expect(props).toMatchObject({ loading: false, loaded: true, ...data }),
          (props) => expect(props.authors[0].name).toBe("Homer")
        ]);

        render(
          <Provider client={client}>
            <Consumer query={AUTHORS}>{mockRender}</Consumer>
          </Provider>
        );

        client.write(AUTHORS, {
          authors: data.authors.map((a, i) => (!i ? { ...a, name: "Homer" } : a))
        });
      });
    });

    it("should not trigger a network request if a query field is cached", (done) => {
      mockQueryRequest<Authors>(POSTS_AND_AUTHORS).then(({ data }) => {
        client.write(POSTS_AND_AUTHORS, data);

        let spy = jest.spyOn(client, "execute");

        let mockRender = createMockRenderFn(done, [
          (props) => {
            expect(props).toMatchObject({ authors: data.authors, loading: false, loaded: true });
            expect(spy).not.toHaveBeenCalled();
          }
        ]);

        render(
          <Provider client={client}>
            <Consumer query={AUTHORS}>{mockRender}</Consumer>
          </Provider>
        );
      });
    });
  });
});

function createMockRenderFn(done, assertionsFns) {
  let currentRender = 0;

  return (props) => {
    let assert = assertionsFns[currentRender];

    if (assert) assertionsFns[currentRender](props);

    if (currentRender++ === assertionsFns.length - 1) done();

    return null;
  };
}
