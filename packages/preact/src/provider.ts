import { Context } from "@grafoo/types";
import { Component } from "preact";

type GrafooPreactProviderProps = Context & { children?: JSX.Element };

export class Provider extends Component<GrafooPreactProviderProps> {
  getChildContext(): Context {
    return { client: this.props.client };
  }

  render(props: GrafooPreactProviderProps): JSX.Element {
    return props.children[0];
  }
}
