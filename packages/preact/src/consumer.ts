import createBindings from "@grafoo/bindings";
import {
  Context,
  GrafooBoundState,
  GrafooBoundMutations,
  GrafooConsumerProps
} from "@grafoo/types";
import { Component, VNode } from "preact";

/**
 * T = Query
 * U = Mutations
 */
type GrafooRenderFn<T, U> = (renderProps: GrafooBoundState & T & GrafooBoundMutations<U>) => VNode;

/**
 * T = Query
 * U = Mutations
 */
type GrafooPreactConsumerProps<T = {}, U = {}> = GrafooConsumerProps<T, U> & {
  children?: GrafooRenderFn<T, U>;
};

/**
 * T = Query
 * U = Mutations
 */
export class Consumer<T = {}, U = {}> extends Component<GrafooPreactConsumerProps<T, U>> {
  state: GrafooBoundState & T & GrafooBoundMutations<U>;

  constructor(props: GrafooPreactConsumerProps<T, U>, context: Context) {
    super(props, context);

    let bindings = createBindings<T, U>(context.client, props, () => {
      this.setState(bindings.getState());
    });

    this.state = bindings.getState();

    this.componentDidMount = () => {
      if (props.skip || !props.query || this.state.loaded) return;

      this.state.load();
    };

    this.componentWillReceiveProps = next => {
      if ((!this.state.loaded && !next.skip) || props.variables !== next.variables)
        this.state.load(next.variables);
    };

    this.componentWillUnmount = () => {
      bindings.unbind();
    };
  }

  render(props, state): VNode {
    return props.children[0](state);
  }
}
