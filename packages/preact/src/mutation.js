import { h } from "preact";

export function Mutation({ children, query }, { client }) {
  const mutate = ({ variables, optimisticUpdate }) => {
    const request = { query, variables };

    if (optimisticUpdate) client.write(request, optimisticUpdate);

    return client.request(request).then(data => ({
      data,
      cache: {
        read: client.read,
        write: client.write
      }
    }));
  };

  return children[0]({ mutate });
}

export function withMutation(query) {
  return Child => {
    const Wrapper = ownProps =>
      h(Mutation, { query }, props => h(Child, Object.assign({}, ownProps, props)));

    if (process.env.NODE_ENV !== "production") Wrapper.displayName = `Mutation(${Child.name})`;

    return Wrapper;
  };
}
