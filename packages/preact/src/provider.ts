import { Context, GrafooPreactProviderProps } from "@grafoo/types";
import { Component } from "preact";

export class GrafooProvider extends Component<GrafooPreactProviderProps> {
  getChildContext(): Context {
    return { client: this.props.client };
  }

  render(props: GrafooPreactProviderProps): JSX.Element {
    return props.children[0];
  }
}
