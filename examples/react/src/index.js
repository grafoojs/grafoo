import "./globalstyles";

import bootstrap from "./bootstrap";

bootstrap();

if (module.hot) {
  module.hot.accept(["./bootstrap"], () => {
    const { default: nextBootstrap } = require("./bootstrap");

    nextBootstrap();
  });
}
