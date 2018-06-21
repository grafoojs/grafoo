import createBindings from "@grafoo/bindings";
import {
  Context,
  GrafooConsumerProps,
  GrafooRenderProps,
  GrafooRenderMutations
} from "@grafoo/types";
import { Component, createContext, createElement, ReactElement, ReactNode, SFC } from "react";

/**
 * T = Query
 * U = Mutations
 */
type GrafooRenderFn<T, U> = (
  renderProps: GrafooRenderProps & T & GrafooRenderMutations<U>
) => ReactNode;

/**
 * T = Query
 * U = Mutations
 */
type GrafooReactConsumerProps<T = {}, U = {}> = GrafooConsumerProps<T, U> & {
  children: GrafooRenderFn<T, U>;
};

/**
 * T = Query
 * U = Mutations
 */
interface ConsumerType extends SFC {
  <T, U>(props: GrafooReactConsumerProps<T, U>): ReactElement<any> | null;
}

let ctx = createContext({});

export let Provider: SFC<Context> = props =>
  createElement(ctx.Provider, { value: props.client }, props.children);

class GrafooConsumer extends Component {
  constructor(props) {
    super(props);

    let { getState, unbind, load } = createBindings(props.client, props, () => this.forceUpdate());

    this.componentDidMount = () => {
      if (props.skip || !props.query || getState().loaded) return;

      load();
    };

    this.componentWillUnmount = () => {
      unbind();
    };

    this.render = (): ReactNode => props.children(getState());
  }
}

/**
 * T = Query
 * U = Mutations
 */
export let Consumer: ConsumerType = <T, U>(consumerProps: GrafooReactConsumerProps<T, U>) =>
  createElement(ctx.Consumer, null, client =>
    createElement(GrafooConsumer, Object.assign({ client }, consumerProps))
  );
