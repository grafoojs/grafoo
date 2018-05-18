import { Component } from "preact";
import createBindings from "./create-bindings";
import { Bindings, Context, GrafooConsumerProps } from "./types";

export class GrafooConsumer extends Component<GrafooConsumerProps> {
  binds: Bindings;
  unlisten: () => void;

  constructor(props: GrafooConsumerProps, context: Context) {
    super(props, context);
    this.binds = createBindings(props, context.client, () => this.setState(null));
  }

  componentDidMount() {
    const { update, getState, executeQuery } = this.binds;
    this.unlisten = this.context.client.listen(objects => update(objects));
    if (!getState().loading || this.props.skipCache) return;
    executeQuery();
  }

  componentWillUnmount() {
    this.unlisten();
  }

  render(props: GrafooConsumerProps) {
    return props.render(this.binds.getState());
  }
}
