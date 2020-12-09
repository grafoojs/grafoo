import createClient from "@grafoo/core";
import graphql from "@grafoo/core/tag";
import createTrasport from "@grafoo/http-transport";
import { mockQueryRequest } from "@grafoo/test-utils";
import { GrafooClient } from "@grafoo/types";
import * as React from "react";
import * as TestRenderer from "react-test-renderer";
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

const AUTHORS = graphql`
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

const AUTHOR = graphql`
  query($id: ID!) {
    author(id: $id) {
      name
    }
  }
`;

const CREATE_AUTHOR = graphql`
  mutation($name: String!) {
    createAuthor(name: $name) {
      name
    }
  }
`;

const POSTS_AND_AUTHORS = graphql`
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

describe("@grafoo/react", () => {
  let client: GrafooClient;

  beforeEach(() => {
    jest.resetAllMocks();
    let transport = createTrasport("https://some.graphql.api/");
    client = createClient(transport, { idFields: ["id"] });
  });

  it("should not crash if a query is not given as prop", () => {
    expect(() =>
      TestRenderer.create(
        <Provider client={client}>
          <Consumer>{() => null}</Consumer>
        </Provider>
      )
    ).not.toThrow();
  });

  it("should not fetch a query if skip prop is set to true", async () => {
    await mockQueryRequest(AUTHORS);

    let spy = jest.spyOn(window, "fetch");

    TestRenderer.create(
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

    TestRenderer.create(
      <Provider client={client}>
        <Consumer query={AUTHORS} skip>
          {() => null}
        </Consumer>
      </Provider>
    );

    expect(spy).toHaveBeenCalled();
  });

  it("should not crash on unmount", () => {
    let testRenderer = TestRenderer.create(
      <Provider client={client}>
        <Consumer query={AUTHORS} skip>
          {() => null}
        </Consumer>
      </Provider>
    );

    expect(() => testRenderer.unmount()).not.toThrow();
  });

  it("should execute render with default render argument", () => {
    let mockRender = jest.fn().mockReturnValue(null);

    TestRenderer.create(
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

  it("should execute render with the right data if a query is specified", async (done) => {
    let { data } = await mockQueryRequest<Authors>(AUTHORS);

    let mockRender = createMockRenderFn(done, [
      (props) => expect(props).toMatchObject({ loading: true, loaded: false }),
      (props) => expect(props).toMatchObject({ loading: false, loaded: true, ...data }),
    ]);

    TestRenderer.create(
      <Provider client={client}>
        <Consumer query={AUTHORS}>{mockRender}</Consumer>
      </Provider>
    );
  });

  it("should render if skip changed value to true", async (done) => {
    let { data } = await mockQueryRequest<Authors>(AUTHORS);

    let mockRender = createMockRenderFn(done, [
      (props) => expect(props).toMatchObject({ loading: false, loaded: false }),
      (props) => expect(props).toMatchObject({ loading: true, loaded: false }),
      (props) => expect(props).toMatchObject({ loading: false, loaded: true, ...data }),
    ]);

    let App: React.FC<{ skip?: boolean }> = ({ skip = false }) => (
      <Provider client={client}>
        <Consumer query={AUTHORS} skip={skip}>
          {mockRender}
        </Consumer>
      </Provider>
    );

    let ctx = TestRenderer.create(<App skip />);

    ctx.update(<App />);

    await new Promise((resolve) => setTimeout(resolve, 10));

    ctx.update(<App />);
  });

  it("should rerender if variables prop has changed", async (done) => {
    let { data } = await mockQueryRequest<Authors>(AUTHORS);

    let mock = async (variables) => {
      return (
        await mockQueryRequest<{ author: Author }>({
          query: AUTHOR.query,
          variables,
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
      (props) => expect(props).toMatchObject({ loading: true, loaded: true, author: firstAuthor }),
      (props) => expect(props.author).toMatchObject(secondAuthor),
    ]);

    class AuthorComponent extends React.Component {
      constructor(props, context) {
        super(props, context);

        this.state = firstVariables;

        setTimeout(async () => {
          secondAuthor = await mock(secondVariables);

          this.setState(secondVariables);
        }, 100);
      }

      render() {
        return (
          <Consumer query={AUTHOR} variables={this.state}>
            {mockRender}
          </Consumer>
        );
      }
    }

    TestRenderer.create(
      <Provider client={client}>
        <AuthorComponent />
      </Provider>
    );
  });

  it("should not trigger a network request if the query is already cached", async (done) => {
    let { data } = await mockQueryRequest<Authors>(AUTHORS);

    client.write(AUTHORS, data);

    jest.resetAllMocks();

    let spy = jest.spyOn(client, "execute");

    let mockRender = createMockRenderFn(done, [
      (props) => expect(props).toMatchObject({ loading: false, loaded: true, ...data }),
    ]);

    TestRenderer.create(
      <Provider client={client}>
        <Consumer query={AUTHORS}>{mockRender}</Consumer>
      </Provider>
    );

    expect(spy).not.toHaveBeenCalled();
  });

  it("should handle simple mutations", async (done) => {
    let variables = { name: "Bart" };

    let data = await mockQueryRequest({ query: CREATE_AUTHOR.query, variables });

    let mockRender = createMockRenderFn(done, [
      (props) => {
        props.createAuthor(variables).then((res) => {
          expect(res).toEqual(data);
        });
      },
    ]);

    let mutations = { createAuthor: { query: CREATE_AUTHOR } };

    TestRenderer.create(
      <Provider client={client}>
        <Consumer mutations={mutations}>{mockRender}</Consumer>
      </Provider>
    );
  });

  it("should handle mutations with cache update", async (done) => {
    let { data } = await mockQueryRequest<Authors>(AUTHORS);

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
      },
    ]);

    TestRenderer.create(
      <Provider client={client}>
        <Consumer
          query={AUTHORS}
          mutations={{
            createAuthor: {
              query: CREATE_AUTHOR,
              optimisticUpdate: ({ authors }, variables) => ({
                authors: [...authors, { ...variables, id: "tempID" }],
              }),
              update: ({ authors }, data) => ({
                authors: authors.map((a) => (a.id === "tempID" ? (data as any).createAuthor : a)),
              }),
            },
          }}
        >
          {mockRender}
        </Consumer>
      </Provider>
    );
  });

  it("should reflect updates that happen outside of the component", async (done) => {
    let { data } = await mockQueryRequest<Authors>(AUTHORS);

    client.write(AUTHORS, data);

    let mockRender = createMockRenderFn(done, [
      (props) => expect(props).toMatchObject({ loading: false, loaded: true, ...data }),
      (props) => expect(props.authors[0].name).toBe("Homer"),
    ]);

    TestRenderer.create(
      <Provider client={client}>
        <Consumer query={AUTHORS}>{mockRender}</Consumer>
      </Provider>
    );

    client.write(AUTHORS, {
      authors: data.authors.map((a, i) => (!i ? { ...a, name: "Homer" } : a)),
    });
  });

  it("should not trigger a network request if a query field is cached", async (done) => {
    let { data } = await mockQueryRequest<Authors>(POSTS_AND_AUTHORS);

    client.write(POSTS_AND_AUTHORS, data);

    let spy = jest.spyOn(client, "execute");

    let mockRender = createMockRenderFn(done, [
      (props) => {
        expect(props).toMatchObject({ authors: data.authors, loading: false, loaded: true });
        expect(spy).not.toHaveBeenCalled();
      },
    ]);

    TestRenderer.create(
      <Provider client={client}>
        <Consumer query={AUTHORS}>{mockRender}</Consumer>
      </Provider>
    );
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
