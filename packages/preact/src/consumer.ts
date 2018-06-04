import createBindings from "@grafoo/bindings";
import { Bindings, Context, GrafooPreactConsumerProps, GrafooRenderProps } from "@grafoo/types";
import { Component } from "preact";

export class Consumer extends Component<GrafooPreactConsumerProps, GrafooRenderProps> {
  binds: Bindings;

  constructor(props: GrafooPreactConsumerProps, context: Context) {
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

  render(props: GrafooPreactConsumerProps, state: GrafooRenderProps) {
    return props.children[0]<JSX.Element>(state);
  }
}
