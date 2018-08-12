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

    let { load, getState, unbind } = createBindings<T, U>(context.client, props, () =>
      this.setState(getState())
    );

    this.state = getState();

    this.componentDidMount = () => {
      if (props.skip || !props.query || getState().loaded) return;

      load();
    };

    this.componentWillReceiveProps = next => {
      if (!this.state.loaded && !next.skip) load();
    };

    this.componentWillUnmount = () => {
      unbind();
    };
  }

  render(props, state): VNode {
    return props.children[0](state);
  }
}
