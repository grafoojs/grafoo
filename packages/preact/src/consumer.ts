import createBindings from "@grafoo/bindings";
import { Context, GrafooPreactConsumerProps, GrafooRenderProps } from "@grafoo/types";
import { Component } from "preact";

export class Consumer extends Component<GrafooPreactConsumerProps, GrafooRenderProps> {
  constructor(props: GrafooPreactConsumerProps, context: Context) {
    super(props, context);

    let { load, getState, unbind } = createBindings(context.client, props, () =>
      this.setState(null)
    );

    this.state = getState();

    this.componentDidMount = () => {
      if (props.skip || !props.query || this.state.loaded) return;

      load();
    };

    this.componentWillUnmount = () => {
      unbind();
    };
  }

  render(props: GrafooPreactConsumerProps, state: GrafooRenderProps) {
    return props.children[0]<JSX.Element>(state);
  }
}
