import "./globalstyles";

import bootstrap from "./bootstrap";
import client from "./client";

bootstrap(client);

if (module.hot) {
  module.hot.accept(["./bootstrap"], () => {
    const { default: nextBootstrap } = require("./bootstrap");

    nextBootstrap(client);
  });
}
