import React from "react";
import { render } from "react-dom";
import App from "./app";

export default function bootstrap() {
  render(<App />, document.getElementById("mnt"));
}
