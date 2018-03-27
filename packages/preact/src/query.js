import { h, Component } from "preact";

var shallowEqual = (a, b) => {
  for (let i in a) if (a[i] !== b[i]) return false;
  for (let i in b) if (!(i in a)) return false;
  return true;
};

export function Query({ query, variables, skipCache, children }, { client }) {
  const cachedQuery = client.read({ query, variables });

  let state =
    cachedQuery && !skipCache ? Object.assign({ loading: false }, cachedQuery) : { loading: true };

  let lockUpdate = false;
  const update = nextObjects => {
    if (lockUpdate) return (lockUpdate = false);

    if (!state.objects) return;

    if (!shallowEqual(nextObjects, state.objects)) {
      state = Object.assign({ loading: false }, client.read({ query, variables }));

      this.setState(null);
    }
  };

  const executeQuery = () =>
    client.request({ query, variables }).then(data => {
      lockUpdate = true;

      client.write({ query, variables }, data);

      state = Object.assign({ loading: false }, client.read({ query, variables }));

      this.setState(null);
    });

  let unwatch;
  this.componentDidMount = () => {
    unwatch = client.watch(update);

    if (!state.loading || skipCache) return;

    executeQuery();
  };

  this.componentWillUnmount = () => {
    unwatch();
  };

  this.render = () => children[0]({ client, data: state.data });
}

(Query.prototype = new Component()).constructor = Query;

export function withQuery(query, variables, skipCache) {
  return Child => {
    const Wrapper = ownProps =>
      h(Query, { query, variables, skipCache }, props =>
        h(Child, Object.assign({}, ownProps, props))
      );

    if (process.env.NODE_ENV !== "production") {
      Wrapper.displayName = `Query(${Child.name})`;
    }

    return Wrapper;
  };
}
