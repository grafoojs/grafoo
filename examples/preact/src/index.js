/* eslint-disable */

import { h, render } from "preact";
import { Provider, Query } from "@grafoo/preact";
import createClient from "@grafoo/core";
import graphql from "@grafoo/loader";

const client = createClient("https://api.graph.cool/simple/v1/cj28ccc28umr50115gjodwzix");

const query = graphql`
  {
    allAuthors {
      firstname
      lastname
    }
  }
`;

const App = () => (
  <Provider client={client}>
    <Query query={query}>
      {props => {
        console.log(props);
        return <h1>hello</h1>;
      }}
    </Query>
  </Provider>
);

render(<App />);
