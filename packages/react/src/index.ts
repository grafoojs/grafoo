import createBindings from "@grafoo/bindings";
import {
  Context,
  GrafooConsumerProps,
  GrafooBoundState,
  GrafooBoundMutations,
  GrafooClient
} from "@grafoo/types";
import { Component, createContext, createElement, ReactElement, ReactNode, SFC } from "react";

/**
 * T = Query
 * U = Mutations
 */
type GrafooRenderFn<T, U> = (
  renderProps: GrafooBoundState & T & GrafooBoundMutations<U>
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

export let ctx = createContext<GrafooClient>(null);

export let Provider: SFC<Context> = props =>
  createElement(ctx.Provider, { value: props.client }, props.children);

class GrafooConsumer<T, U> extends Component<GrafooReactConsumerProps<T, U>> {
  state: GrafooBoundState & T & GrafooBoundMutations<U>;

  constructor(props) {
    super(props);

    let bindings = createBindings<T, U>(props.client, props, () => {
      this.setState(bindings.getState());
    });

    this.state = bindings.getState();

    this.componentDidMount = () => {
      if (props.skip || !props.query || this.state.loaded) return;

      bindings.load();
    };

    this.componentWillReceiveProps = next => {
      if ((!this.state.loaded && !next.skip) || props.variables !== next.variables) {
        bindings.load(next.variables);
      }
    };

    this.componentWillUnmount = () => {
      bindings.unbind();
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
export let Consumer: ConsumerType = <T, U>(props: GrafooReactConsumerProps<T, U>) =>
  createElement(ctx.Consumer, null, client =>
    createElement(GrafooConsumer, Object.assign({ client }, props))
  );
