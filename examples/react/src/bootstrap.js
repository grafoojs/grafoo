import React from "react";
import { render } from "react-dom";
import App from "./app";

export default function bootstrap(client) {
  render(<App client={client} />, document.getElementById("mnt"));
}
