import createBindings from "@grafoo/bindings";
import {
  Context,
  GrafooConsumerProps,
  GrafooBoundState,
  GrafooBoundMutations
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

let ctx = createContext({});

export let Provider: SFC<Context> = props =>
  createElement(ctx.Provider, { value: props.client }, props.children);

class GrafooConsumer<T, U> extends Component<GrafooReactConsumerProps<T, U>> {
  state: GrafooBoundState & T & GrafooBoundMutations<U>;

  constructor(props) {
    super(props);

    let { getState, unbind, load } = createBindings<T, U>(props.client, props, () => {
      this.setState(getState());
    });

    this.state = getState();

    this.componentDidMount = () => {
      if (props.skip || !props.query || !getState().loading) return;

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
export let Consumer: ConsumerType = <T, U>(props: GrafooReactConsumerProps<T, U>) =>
  createElement(ctx.Consumer, null, client =>
    createElement(GrafooConsumer, Object.assign({ client }, props))
  );
