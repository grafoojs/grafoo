import createClient from "@grafoo/core";
import bootstrap from "./bootstrap";

import { injectGlobal } from "emotion";

injectGlobal`
  * {
    box-sizing: border-box;
  }

  body, html {
    margin: 0;
    padding: 0;
    font: 14px/1.21 'Helvetica Neue', arial, sans-serif;
  }
`;

const client = createClient("https://api.graph.cool/simple/v1/cj28ccc28umr50115gjodwzix", {
  idFromProps: _ => _.id
});

if (process.env.NODE_ENV !== "production") {
  window.client = client;
}

bootstrap(client);

if (module.hot) {
  module.hot.accept(["./bootstrap"], () => {
    const { default: nextBootstrap } = require("./bootstrap");

    nextBootstrap(client);
  });
}
