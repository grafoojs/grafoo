import { ClientInstance } from "@grafoo/core";
import { Component } from "preact";

export class Provider extends Component<{ client: ClientInstance }> {
  getChildContext() {
    return { client: this.props.client };
  }

  render(props) {
    return props.children[0];
  }
}
