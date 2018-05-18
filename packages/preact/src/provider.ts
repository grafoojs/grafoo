import { Component } from "preact";
import { Context } from "./types";

export class GrafooProvider extends Component<Context> {
  getChildContext(): Context {
    return { client: this.props.client };
  }

  render(props) {
    return props.children[0];
  }
}
