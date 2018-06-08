import createBindings from "@grafoo/bindings";
import {
  ClientInstance,
  GrafooReactConsumerProps,
  GrafooRenderProps,
  Context
} from "@grafoo/types";
import { Component, createContext, createElement, ReactNode, SFC } from "react";

let ctx = createContext({});

export let Provider: SFC<Context> = props =>
  createElement(ctx.Provider, { value: props.client }, props.children);

export let Consumer: SFC<GrafooReactConsumerProps> = consumerProps =>
  createElement(ctx.Consumer, null, (clientInstance: ClientInstance) =>
    createElement(
      class GrafooConsumer extends Component<GrafooReactConsumerProps, GrafooRenderProps> {
        constructor(props: GrafooReactConsumerProps) {
          super(props);

          let { getState, unbind, load } = createBindings(clientInstance, props, () =>
            this.forceUpdate()
          );

          let state = getState();

          this.componentDidMount = () => {
            if (props.skip || !props.query || state.loaded) return;

            load();
          };

          this.componentWillUnmount = () => {
            unbind();
          };

          this.render = () => props.children<ReactNode>(state);
        }
      },
      consumerProps
    )
  );
