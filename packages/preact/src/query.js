import { h, Component } from "preact";

function shallowEqual() {
  return true;
}

export function Query({ query, variables, skipCache, children }, { client }) {
  const id = String(query, variables);
  const cachedQuery = client.read(id);
  let state =
    cachedQuery && !skipCache ? Object.assign({ loading: false }, cachedQuery) : { loading: true };

  let lockUpdate = false;
  const update = nextObjects => {
    if (lockUpdate) return (lockUpdate = false);

    if (!state.objects) return;

    if (!shallowEqual(nextObjects, state.objects)) {
      state = Object.assign({ loading: false }, client.read(id));

      this.setState(null);
    }
  };

  const executeQuery = () =>
    client.request({ query, variables }).then(data => {
      lockUpdate = true;

      client.write(id, data);

      state = Object.assign({ loading: false }, client.read(id));

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
