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

var ctx = createContext({});

export var Provider: SFC<Context> = props =>
  createElement(ctx.Provider, { value: props.client }, props.children);

class GrafooConsumer<T, U> extends Component<GrafooReactConsumerProps<T, U>> {
  state: GrafooRenderProps & T & GrafooRenderMutations<U>;

  constructor(props) {
    super(props);

    var { getState, unbind, load } = createBindings<T, U>(props.client, props, () => {
      this.setState(getState());
    });

    this.state = getState();

    this.componentDidMount = () => {
      if (props.skip || !props.query || getState().loaded) return;

      load();
    };

    this.componentWillUnmount = () => {
      unbind();
    };
  }

  render() {
    return this.props.children(this.state);
  }
}

/**
 * T = Query
 * U = Mutations
 */
export var Consumer: ConsumerType = <T, U>(props: GrafooReactConsumerProps<T, U>) =>
  createElement(ctx.Consumer, null, client =>
    createElement(GrafooConsumer, Object.assign({ client }, props))
  );
