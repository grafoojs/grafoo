import createBindings from "@grafoo/bindings";
import {
  ClientInstance,
  GrafooReactConsumerProps,
  GrafooRenderProps,
  Context
} from "@grafoo/types";
import { Component, createContext, createElement, ReactNode, SFC } from "react";

const ctx = createContext({});

export const Provider: SFC<Context> = props =>
  createElement(ctx.Provider, { value: props.client }, props.children);

export const Consumer: SFC<GrafooReactConsumerProps> = consumerProps =>
  createElement(ctx.Consumer, null, (clientInstance: ClientInstance) =>
    createElement(
      class GrafooConsumer extends Component<GrafooReactConsumerProps, GrafooRenderProps> {
        constructor(props: GrafooReactConsumerProps) {
          super(props);

          const { getState, unbind, load } = createBindings(clientInstance, props, () =>
            this.forceUpdate()
          );

          const state = getState();

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
