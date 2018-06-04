import createBindings from "@grafoo/bindings";
import {
  Bindings,
  ClientInstance,
  GrafooReactConsumerProps,
  GrafooRenderProps
} from "@grafoo/types";
import { Component, createContext, createElement, ReactNode, SFC } from "react";

export default function createGrafooContext(
  client: ClientInstance
): {
  Provider: SFC;
  Consumer: SFC<GrafooReactConsumerProps>;
} {
  // @ts-ignore
  const CTX = createContext();

  function getConsumer(clientInstance: ClientInstance) {
    return class extends Component<GrafooReactConsumerProps, GrafooRenderProps> {
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
    };
  }

  const GrafooConsumer: SFC<GrafooReactConsumerProps> = props =>
    createElement(CTX.Consumer, null, (clientInstance: ClientInstance) =>
      createElement(getConsumer(clientInstance), props)
    );

  const GrafooProvider: SFC = props =>
    createElement(CTX.Provider, { value: client }, props.children);

  return { Provider: GrafooProvider, Consumer: GrafooConsumer };
}
