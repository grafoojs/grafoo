import { h, render } from "preact";
import App from "./App";

const mnt = document.getElementById("mnt");

export default function bootstrap(client) {
  render(<App client={client} />, mnt, mnt.lastChild);
}
