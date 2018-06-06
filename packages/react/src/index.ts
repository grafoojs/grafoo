import createBindings from "@grafoo/bindings";
import {
  Bindings,
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
        binds: Bindings;

        constructor(props: GrafooReactConsumerProps) {
          super(props);

          const { getState, unbind, executeQuery } = (this.binds = createBindings(
            clientInstance,
            props,
            nextRenderProps => this.setState(nextRenderProps)
          ));

          this.state = getState();

          this.componentDidMount = () => {
            if (props.skip || !props.query || this.state.loaded) return;

            executeQuery();
          };

          this.componentWillUnmount = () => {
            unbind();
          };

          this.render = () => props.children<ReactNode>(this.state);
        }
      },
      consumerProps
    )
  );
