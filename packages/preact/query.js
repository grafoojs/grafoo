import { h, Component } from "preact";
import { queryID, shallowEqual, assign } from "../../util";

export function Query({ query, variables, skipCache, children }, { client }) {
  const id = queryID(query, variables);
  const cachedQuery = client.read(id);
  let state =
    cachedQuery && !skipCache ? assign({ loading: false }, cachedQuery) : { loading: true };

  let lockUpdate = false;
  const update = nextObjects => {
    if (lockUpdate) return (lockUpdate = false);

    if (!state.objects) return;

    if (!shallowEqual(nextObjects, state.objects)) {
      state = assign({ loading: false }, client.read(id));

      this.setState(null);
    }
  };

  const executeQuery = () =>
    client.request({ query, variables }).then(data => {
      lockUpdate = true;

      client.write(id, data);

      state = assign({ loading: false }, client.read(id));

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
      h(Query, { query, variables, skipCache }, props => h(Child, assign({}, ownProps, props)));

    if (process.env.NODE_ENV !== "production") {
      Wrapper.displayName = `Query(${Child.name})`;
    }

    return Wrapper;
  };
}
