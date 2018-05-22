import { Component } from "preact";
import createBindings from "./create-bindings";
import { Bindings, Context, GrafooConsumerProps, GrafooRenderProps } from "./types";

export class GrafooConsumer extends Component<GrafooConsumerProps, GrafooRenderProps> {
  binds: Bindings;

  constructor(props: GrafooConsumerProps, context: Context) {
    super(props, context);

    const { update, executeQuery, getState } = (this.binds = createBindings(
      props,
      context.client,
      nextRenderProps => this.setState(nextRenderProps)
    ));

    this.state = getState();

    let unlisten: () => void;

    this.componentDidMount = () => {
      if (!props.query) return;

      unlisten = context.client.listen(objects => update(objects));

      if (props.skipCache) return;

      executeQuery();
    };

    this.componentWillUnmount = () => {
      unlisten();
    };
  }

  render(props: GrafooConsumerProps, renderProps: GrafooRenderProps) {
    return props.render(renderProps);
  }
}
