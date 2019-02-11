import createTrasport from "@grafoo/http-transport";
import createClient from "@grafoo/core";
import { GrafooClient } from "@grafoo/types";
import { mockQueryRequest } from "@grafoo/test-utils";
import { Provider } from "../src";
import useGrafoo from "../src/hooks";
import * as TestRenderer from "react-test-renderer";
import * as React from "react";
import { AUTHORS, Authors } from ".";

describe("@grafoo/react/hooks", () => {
  let client: GrafooClient;

  beforeEach(() => {
    jest.resetAllMocks();
    client = createClient(createTrasport("https://some.graphql.api/"), { idFields: ["id"] });
  });

  it("should not crash if a query is not given as prop", () => {
    let Comp = () => {
      useGrafoo({});
      return null;
    };

    expect(() =>
      TestRenderer.create(
        <Provider client={client}>
          <Comp />
        </Provider>
      )
    ).not.toThrow();
  });

  it("should not fetch a query if skip prop is set to true", async () => {
    let Comp = () => {
      useGrafoo({ skip: true, query: AUTHORS });
      return null;
    };

    await mockQueryRequest(AUTHORS);

    const spy = jest.spyOn(window, "fetch");

    TestRenderer.create(
      <Provider client={client}>
        <Comp />
      </Provider>
    );

    expect(spy).not.toHaveBeenCalled();
  });

  it("should trigger listen on client instance", async () => {
    let Comp = () => {
      useGrafoo({ skip: true, query: AUTHORS });
      return null;
    };

    await mockQueryRequest(AUTHORS);

    const spy = jest.spyOn(client, "listen");

    TestRenderer.create(
      <Provider client={client}>
        <Comp />
      </Provider>
    );

    expect(spy).toHaveBeenCalled();
  });

  it("should not crash on unmount", () => {
    let Comp = () => {
      useGrafoo({ skip: true, query: AUTHORS });
      return null;
    };

    const testRenderer = TestRenderer.create(
      <Provider client={client}>
        <Comp />
      </Provider>
    );

    expect(() => testRenderer.unmount()).not.toThrow();
  });

  it("should provide default state", () => {
    let Comp = () => {
      let state = useGrafoo({ skip: true, query: AUTHORS });

      expect(state).toMatchObject({ loading: false, loaded: false });
      expect(state.client).toBe(client);
      expect(typeof state.load).toBe("function");

      return null;
    };

    TestRenderer.create(
      <Provider client={client}>
        <Comp />
      </Provider>
    );
  });

  it("should execute render with the right data if a query is specified", async done => {
    let { data } = await mockQueryRequest<Authors>(AUTHORS);

    let useAssertions = createAssertions(done, [
      state => expect(state).toMatchObject({ loading: true, loaded: false }),
      state => expect(state).toMatchObject({ loading: false, loaded: true, authors: data.authors })
    ]);

    let Comp = () => {
      useAssertions(useGrafoo({ query: AUTHORS }));
      return null;
    };

    TestRenderer.create(
      <Provider client={client}>
        <Comp />
      </Provider>
    );
  });

  it("should render if skip changed value to true", async done => {
    let { data } = await mockQueryRequest(AUTHORS);
    let useAssertions = createAssertions(done, [
      state => expect(state).toMatchObject({ loading: false, loaded: false }),
      state => expect(state).toMatchObject({ loading: true, loaded: false }),
      state => expect(state).toMatchObject({ loading: false, loaded: true, authors: data.authors })
    ]);

    let Comp = ({ skip }) => {
      useAssertions(useGrafoo({ query: AUTHORS, skip }));
      return null;
    };

    let App = ({ skip = false }) => (
      <Provider client={client}>
        <Comp skip={skip} />
      </Provider>
    );

    TestRenderer.create(<App skip />).update(<App />);
  });
});

function createAssertions(done: jest.DoneCallback, assertions: ((state: any) => any)[]) {
  let i = 0;

  return (state: any) => {
    let assert = assertions[i];
    if (assert) assert(state);
    if (i++ === assertions.length - 1) done();
  };
}
