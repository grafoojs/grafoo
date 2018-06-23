import createBindings from "@grafoo/bindings";
import {
  Context,
  GrafooRenderProps,
  GrafooRenderMutations,
  GrafooConsumerProps
} from "@grafoo/types";
import { Component } from "preact";

/**
 * T = Query
 * U = Mutations
 */
type GrafooRenderFn<T, U> = (
  renderProps: GrafooRenderProps & T & GrafooRenderMutations<U>
) => JSX.Element;

/**
 * T = Query
 * U = Mutations
 */
type GrafooPreactConsumerProps<T = {}, U = {}> = GrafooConsumerProps<T, U> & {
  children?: [GrafooRenderFn<T, U>];
};

/**
 * T = Query
 * U = Mutations
 */
interface ConsumerType extends Component {
  <T, U>(props: GrafooPreactConsumerProps<T, U> & { children?: JSX.Element[] }): JSX.Element;
}

/**
 * T = Query
 * U = Mutations
 */
// @ts-ignore
export var Consumer: ConsumerType = function GrafooConsumer<T, U>(
  props: GrafooPreactConsumerProps<T, U>,
  context: Context
) {
  var { load, getState, unbind } = createBindings(context.client, props, () => this.setState(null));

  this.componentDidMount = () => {
    if (props.skip || !props.query || getState().loaded) return;

    load();
  };

  this.componentWillUnmount = () => {
    unbind();
  };

  this.render = () => props.children[0](getState());
};

// @ts-ignore
(Consumer.prototype = new Component()).constructor = Consumer;
