import createBindings from "@grafoo/bindings";
import {
  Bindings,
  ClientInstance,
  GrafooReactConsumerProps,
  GrafooRenderProps
} from "@grafoo/types";
import { Component, createContext, createElement, ReactNode, SFC } from "react";

export default function createGrafooComsumer(
  client: ClientInstance
): SFC<GrafooReactConsumerProps> {
  return consumerProps =>
    createElement(createContext(client).Consumer, null, (clientInstance: ClientInstance) =>
      createElement(
        // disabling the next line because it causes the build to fail
        // tslint:disable-next-line only-arrow-functions
        (function() {
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
        })(),
        consumerProps
      )
    );
}
