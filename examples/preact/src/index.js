import { h, render } from "preact";
import { Provider } from "@grafoo/preact";
import createClient from "@grafoo/core";
import PostsList from "./components/PostsList";
import PostForm from "./components/PostForm";
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

const client = createClient("https://api.graph.cool/simple/v1/cj28ccc28umr50115gjodwzix");

window.client = client;

render(
  <Provider client={client}>
    <div>
      <PostForm />
      <PostsList />
    </div>
  </Provider>,
  document.getElementById("mnt")
);
