import { Component, VNode } from "preact";
import { shallowEqual, assign } from "@grafoo/util";

import { GraphQlError, Variables } from "@grafoo/transport";
import { ClientInstance } from "@grafoo/core";
import { GrafooObject, ObjectsMap } from "@grafoo/cache";

export type QueryRenderFn = (props: State) => VNode<any>;

export interface Props {
  query: GrafooObject;
  variables?: Variables;
  skipCache?: boolean;
  children: [QueryRenderFn];
}

export interface State {
  loading: boolean;
  data?: { [key: string]: any };
  objects?: ObjectsMap;
  errors?: GraphQlError[];
}

export interface Context {
  client: ClientInstance;
}

export interface Bindings {
  state: State;
  update(nextObjects: ObjectsMap, cb: () => void);
  executeQuery(cb: () => void);
}

function createBindings(props: Props, context: Context): Bindings {
  const { query, variables, skipCache } = props;
  const { client } = context;
  const request = { query, variables };
  const cachedQuery = client.read(request);
  const state: State =
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

export class Query extends Component<Props> {
  bindings: Bindings;

  constructor(props: Props, context: Context) {
    super(props, context);

    this.bindings = createBindings(props, context);

    const { client } = context;
    const { update, state, executeQuery } = this.bindings;
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
    return props.children[0](this.bindings.state);
  }
}
