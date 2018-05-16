import { assign, shallowEqual } from "@grafoo/util";
import { Component } from "preact";
import { Bindings, Context, QueryProps, QueryRenderProps } from "./types";

function createBindings(props: QueryProps, context: Context): Bindings {
  const { query, variables, skipCache } = props;
  const { client } = context;
  const request = { query, variables };
  const cachedQuery = client.read(request);
  const state: QueryRenderProps =
    cachedQuery && !skipCache ? assign({ loading: false }, cachedQuery) : { loading: true };

  let lockUpdate = false;

  return {
    get state() {
      return state;
    },
    update(nextObjects, cb) {
      if (lockUpdate) return (lockUpdate = false);

      if (!state.objects) return;

      if (!shallowEqual(nextObjects, state.objects)) {
        assign(state, client.read(request));

        cb();
      }
    },
    executeQuery(cb) {
      return client.request({ query: query.query, variables }).then(data => {
        lockUpdate = true;

        client.write(request, data);

        assign(state, { loading: false }, client.read(request));

        cb();
      });
    }
  };
}

export class Query extends Component<QueryProps> {
  private binds: Bindings;

  constructor(props: QueryProps, context: Context) {
    super(props, context);

    this.binds = createBindings(props, context);

    const { client } = context;
    const { update, state, executeQuery } = this.binds;
    const forceUpdate = () => this.setState(null);

    let unlisten: () => void;
    this.componentDidMount = () => {
      unlisten = client.listen(objects => update(objects, forceUpdate));

      if (!state.loading || props.skipCache) return;

      executeQuery(forceUpdate);
    };

    this.componentWillUnmount = () => {
      unlisten();
    };
  }

  render(props) {
    return props.render(this.binds.state);
  }
}
