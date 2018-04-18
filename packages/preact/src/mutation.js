import { h } from "preact";
import { assign } from "@grafoo/util";

export function Mutation({ children, query: { query } }, { client }) {
  return children[0]({
    mutate: ({ variables }) => client.request({ query, variables }),
    client
  });
}

export function withMutation(query) {
  return Child => {
    const WithMutation = ownProps =>
      h(Mutation, { query }, props => h(Child, assign({}, ownProps, props)));

    return WithMutation;
  };
}
