import { Context } from "@grafoo/types";
import { Component, VNode } from "preact";

export class GrafooProvider extends Component<Context> {
  getChildContext(): Context {
    return { client: this.props.client };
  }

  render(props: Context & { children: [VNode] }): VNode {
    return props.children[0];
  }
}
