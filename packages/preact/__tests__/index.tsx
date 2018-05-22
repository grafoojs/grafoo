import createClient, { ClientInstance } from "@grafoo/core";
import { h } from "preact";
import { render } from "preact-render-spy";
import { GrafooProvider } from "../src";

describe("@grafoo/preact", () => {
  let client: ClientInstance;

  beforeEach(() => {
    client = createClient("https://some.graphql.api/");
  });

  test("<GrafooProvider />", done => {
    const Comp = ({}, context) => {
      expect(context.client).toEqual(client);

      return <span>testing...</span>;
    };

    const App = () => (
      <GrafooProvider client={client}>
        <Comp />
      </GrafooProvider>
    );

    render(<App />);

    done();
  });
});
