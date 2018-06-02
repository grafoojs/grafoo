import React from "react";
import { render } from "react-dom";
import App from "./components/App";

export default function bootstrap() {
  render(<App />, document.getElementById("mnt"));
}
