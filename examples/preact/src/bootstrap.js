import { h, render } from "preact";
import { Provider } from "@grafoo/preact";

import PostsList from "./components/PostsList";
import PostForm from "./components/PostForm";

const mnt = document.getElementById("mnt");

export default function bootstrap(client) {
  const App = () => (
    <Provider client={client}>
      <div>
        <PostForm />
        <PostsList />
      </div>
    </Provider>
  );

  render(<App />, mnt, mnt.lastChild);
}
