import createBindings from "@grafoo/bindings";
import { Bindings, Context, GrafooConsumerProps, GrafooRenderProps } from "@grafoo/types";
import { Component, VNode } from "preact";

export class GrafooConsumer extends Component<GrafooConsumerProps, GrafooRenderProps> {
  binds: Bindings;

  constructor(props: GrafooConsumerProps, context: Context) {
    super(props, context);

    const { executeQuery, getState, unbind } = (this.binds = createBindings(
      context.client,
      props,
      nextRenderProps => this.setState(nextRenderProps)
    ));

    this.state = getState();

    this.componentDidMount = () => {
      if (props.skip || !props.query || this.state.loaded) return;

      executeQuery();
    };

    this.componentWillUnmount = () => {
      unbind();
    };
  }

  render(props: GrafooConsumerProps, state: GrafooRenderProps) {
    return props.children[0]<VNode>(state);
  }
}
