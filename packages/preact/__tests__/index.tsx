/* tslint:disable */

import createClient, { ClientInstance } from "@grafoo/core";
import { Posts } from "@grafoo/test-utils";
import { render } from "preact-render-spy";
import { Mutation, Provider } from "../src";

describe("@grafoo/preact", () => {
  let client: ClientInstance;
  beforeEach(() => {
    client = createClient("");
  });

  test("<Mutation />", done => {
    const Comp = () => (
      <Mutation
        query={Posts}
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
