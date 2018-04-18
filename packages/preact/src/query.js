import { h, Component } from "preact";
import { shallowEqual, assign } from "@grafoo/util";

export function Query({ query, variables, skipCache, children }, { client }) {
  const request = { query, variables };
  const cachedQuery = client.read(request);

  let state =
    cachedQuery && !skipCache ? assign({ loading: false }, cachedQuery) : { loading: true };

  let lockUpdate = false;
  const update = nextObjects => {
    if (lockUpdate) return (lockUpdate = false);

    if (!state.objects) return;

    if (!shallowEqual(nextObjects, state.objects)) {
      assign(state, client.read(request));

      this.setState(null);
    }
  };

  const executeQuery = () =>
    client.request({ query: query.query, variables }).then(data => {
      lockUpdate = true;

      client.write(request, data);

      assign(state, { loading: false }, client.read(request));

      this.setState(null);
    });

  let unlisten;
  this.componentDidMount = () => {
    unlisten = client.listen(update);

    if (!state.loading || skipCache) return;

    executeQuery();
  };

  this.componentWillUnmount = () => {
    unlisten();
  };

  this.render = () => children[0]({ data: state.data, loading: state.loading });
}

(Query.prototype = new Component()).constructor = Query;

export function withQuery(query, variables, skipCache) {
  return Child => {
    const WithQuery = ownProps =>
      h(Query, { query, variables, skipCache }, props => h(Child, assign({}, ownProps, props)));

    return WithQuery;
  };
}
