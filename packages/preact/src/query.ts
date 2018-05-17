import { Component } from "preact";
import createBindings from "./create-bindings";
import { Bindings, Context, QueryProps } from "./types";

export class Query extends Component<QueryProps> {
  private binds: Bindings;
  private unlisten: () => void;

  constructor(props: QueryProps, context: Context) {
    super(props, context);
    this.binds = createBindings(props, context);
  }

  componentDidMount() {
    const { update, state, executeQuery } = this.binds;
    const forceUpdate = () => this.setState(null);
    this.unlisten = this.context.client.listen(objects => update(objects, forceUpdate));
    if (!state.loading || this.props.skipCache) return;
    executeQuery(forceUpdate);
  }

  componentWillUnmount() {
    this.unlisten();
  }

  render(props: QueryProps) {
    return props.render(this.binds.state);
  }
}
