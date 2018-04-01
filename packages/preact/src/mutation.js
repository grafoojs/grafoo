import { h } from "preact";

export function Mutation({ children, query }, { client }) {
  return children[0]({
    client,
    mutate: ({ variables }) => client.request({ query, variables })
  });
}

export function withMutation(query) {
  return Child => {
    const Wrapper = ownProps =>
      h(Mutation, { query }, props => h(Child, Object.assign({}, ownProps, props)));

    if (process.env.NODE_ENV !== "production") Wrapper.displayName = `Mutation(${Child.name})`;

    return Wrapper;
  };
}
