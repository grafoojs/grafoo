/* tslint:disable */

import { h } from "preact";
import { render } from "preact-render-spy";

import { GrafooObject } from "@grafoo/cache";
import createClient, { ClientInstance } from "@grafoo/core";
import graphql from "@grafoo/core/tag";

import { Provider, Mutation } from "../src";

const ADD_QUERY: GrafooObject = graphql`
  mutation {
    add
  }
`;

describe("@grafoo/preact", () => {
  let client: ClientInstance;
  beforeEach(() => {
    client = createClient("");
  });

  test("<Mutation />", done => {
    const Comp = () => (
      <Mutation
        query={ADD_QUERY}
        render={({ mutate }) => (
          <button
            onClick={async _ => {
              const data = await mutate();

              expect(data).toMatchObject({ add: 1 });

              done();
            }}
          >
            click me
          </button>
        )}
      />
    );

    const App = () => (
      <Provider client={client}>
        <Comp />
      </Provider>
    );

    render(<App />)
      .find("button")
      .simulate("click");
  });
});
