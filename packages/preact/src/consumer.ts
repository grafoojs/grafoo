import { Component } from "preact";
import createBindings from "./create-bindings";
import { Bindings, Context, GrafooConsumerProps } from "./types";

export class GrafooConsumer extends Component<GrafooConsumerProps> {
  binds: Bindings;

  constructor(props: GrafooConsumerProps, context: Context) {
    super(props, context);

    const { client } = context;
    const { update, executeQuery } = (this.binds = createBindings(props, context.client, () =>
      this.setState(null)
    ));

    let unlisten: () => void;

    this.componentDidMount = () => {
      unlisten = client.listen(objects => update(objects));

      if (props.skipCache) return;

      executeQuery();
    };

    this.componentWillUnmount = () => {
      unlisten();
    };
  }

  render(props: GrafooConsumerProps) {
    return props.render(this.binds.getState());
  }
}
