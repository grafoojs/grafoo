import { h } from "preact";
import { assign } from "@grafoo/util";

export function Mutation({ children, query: { doc } }, { client }) {
  return children[0]({
    mutate: variables => client.request({ query: doc, variables }),
    client
  });
}

export function withMutation({ doc }) {
  return Child => {
    const WithMutation = ownProps =>
      h(Mutation, { query: { doc } }, props => h(Child, assign({}, ownProps, props)));

    return WithMutation;
  };
}
