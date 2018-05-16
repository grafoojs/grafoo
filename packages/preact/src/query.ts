import { Component } from "preact";
import { shallowEqual, assign } from "@grafoo/util";

import { GraphQlError, Variables } from "@grafoo/transport";
import { ClientInstance } from "@grafoo/core";
import { GrafooObject, ObjectsMap } from "@grafoo/cache";

export interface QueryRenderProps {
  loading: boolean;
  data?: { [key: string]: any };
  objects?: ObjectsMap;
  errors?: GraphQlError[];
}

export type QueryRenderFn = (props: QueryRenderProps) => JSX.Element;

export interface QueryProps {
  query: GrafooObject;
  variables?: Variables;
  skipCache?: boolean;
  render: QueryRenderFn;
}

export interface Bindings {
  state: QueryRenderProps;
  update(nextObjects: ObjectsMap, cb: () => void);
  executeQuery(cb: () => void);
}

function createBindings(props: QueryProps, context: { client: ClientInstance }): Bindings {
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

  constructor(props: QueryProps, context: { client: ClientInstance }) {
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
