import { h, render } from "preact";
import { Provider, Query } from "@grafoo/preact";
import createClient from "@grafoo/core";
import graphql from "@grafoo/loader";

const client = createClient("https://api.graph.cool/simple/v1/cj28ccc28umr50115gjodwzix");

const query = graphql`
  query {
    allAuthors {
      firstname
      lastname
    }
  }
`;

const App = () => (
  <Provider client={client}>
    <Query query={query}>
      {({ data, loading, errors }) => <pre>{JSON.stringify(data, null, 2)}</pre>}}
    </Query>
  </Provider>
);

render(<App />, document.getElementById("mnt"));
