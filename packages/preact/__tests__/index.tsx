import createClient from "@grafoo/core";
import { ClientInstance, GrafooMutation } from "@grafoo/types";
import { mockQueryRequest, Authors, CreateAuthor } from "@grafoo/test-utils";
import { h } from "preact";
import { render } from "preact-render-spy";
import { GrafooProvider, GrafooConsumer } from "../src";

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

interface AllAuthors {
  allAuthors: Author[];
}

describe("@grafoo/preact", () => {
  let client: ClientInstance;

  beforeEach(() => {
    jest.resetAllMocks();

    client = createClient("https://some.graphql.api/");
  });

  describe("<GrafooProvider />", () => {
    it("should provide the client in it's context", done => {
      const Comp = ({}, context) => {
        expect(context.client).toBe(client);

        return null;
      };

      render(
        <GrafooProvider client={client}>
          <Comp />
        </GrafooProvider>
      );

      done();
    });
  });

  describe("<GrafooConsumer />", () => {
    it("should not crash if a query is not given as prop", () => {
      expect(() =>
        render(
          <GrafooProvider client={client}>
            <GrafooConsumer render={() => null} />
          </GrafooProvider>
        )
      ).not.toThrow();
    });

    it("should not fetch a query if skip prop is set to true", async () => {
      await mockQueryRequest(Authors);

      const spy = jest.spyOn(window, "fetch");

      render(
        <GrafooProvider client={client}>
          <GrafooConsumer query={Authors} skip render={() => null} />
        </GrafooProvider>
      );

      expect(spy).not.toHaveBeenCalled();
    });

    it("should trigger listen on client instance", async () => {
      await mockQueryRequest(Authors);

      const spy = jest.spyOn(client, "listen");

      render(
        <GrafooProvider client={client}>
          <GrafooConsumer query={Authors} skip render={() => null} />
        </GrafooProvider>
      );

      expect(spy).toHaveBeenCalled();
    });

    it("should not crash on unmount", () => {
      const ctx = render(
        <GrafooProvider client={client}>
          <GrafooConsumer skip render={() => null} />
        </GrafooProvider>
      );

      expect(() => ctx.render(null)).not.toThrow();
    });

    it("should execute render with default render argument", () => {
      const mockRender = jest.fn();

      render(
        <GrafooProvider client={client}>
          <GrafooConsumer query={Authors} skip render={mockRender} />
        </GrafooProvider>
      );

      expect(mockRender).toHaveBeenCalledWith({ loading: true, loaded: false });
    });

    it("should execute render with the right data if a query is specified", async done => {
      const { data } = await mockQueryRequest(Authors);

      let calls = 1;
      const fn = props => {
        if (calls++ === 2) {
          expect(props).toMatchObject({ loading: false, loaded: true, ...data });

          done();
        } else {
          expect(props).toMatchObject({ loading: true, loaded: false });
        }

        return null;
      };

      render(
        <GrafooProvider client={client}>
          <GrafooConsumer query={Authors} render={fn} />
        </GrafooProvider>
      );
    });

    it("should handle mutations", async done => {
      const { data } = await mockQueryRequest(Authors);

      let calls = 1;
      const fn = props => {
        if (calls++ === 2) {
          expect(props).toMatchObject({ loading: false, loaded: true, ...data });

          done();
        } else {
          expect(props).toMatchObject({ loading: true, loaded: false });
        }

        return null;
      };

      const createAuthor: GrafooMutation<AllAuthors, CreateAuthor> = {
        query: CreateAuthor,
        optimisticUpdate: ({ allAuthors }, variables) => ({
          allAuthors: [...allAuthors, { ...(variables as Author), id: "tempID" }]
        }),
        update: ({ mutate, allAuthors }, variables) =>
          mutate(variables).then(({ createAuthor: author }) => ({
            allAuthors: allAuthors.map(a => (a.id === "tempID" ? author : a))
          }))
      };

      render(
        <GrafooProvider client={client}>
          <GrafooConsumer query={Authors} render={fn} mutations={{ createAuthor }} />
        </GrafooProvider>
      );
    });
  });
});
