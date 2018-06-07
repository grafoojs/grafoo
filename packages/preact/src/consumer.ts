import createBindings from "@grafoo/bindings";
import { Context, GrafooPreactConsumerProps, GrafooRenderProps } from "@grafoo/types";
import { Component } from "preact";

/**
 * using this flag here because preact definitions
 * force you to implement the abstract render method
 * I'm declaring it as a property to save some bytes
 * on the final bundle. Take CAUTION if you are editing this file.
 */

// @ts-ignore
export class Consumer extends Component<GrafooPreactConsumerProps, GrafooRenderProps> {
  constructor(props: GrafooPreactConsumerProps, context: Context) {
    super(props, context);

    const { load, getState, unbind } = createBindings(context.client, props, () =>
      this.setState(null)
    );

    const state = getState();

    this.componentDidMount = () => {
      if (props.skip || !props.query || state.loaded) return;

      load();
    };

    this.componentWillUnmount = () => {
      unbind();
    };

    this.render = () => props.children[0]<JSX.Element>(state);
  }
}
