import { h, render } from "preact";
import { Provider as GrafooProvider } from "@grafoo/preact";

import PostsList from "./components/PostsList";
import PostForm from "./components/PostForm";

const mnt = document.getElementById("mnt");

export default function bootstrap(client) {
  const App = () => (
    <GrafooProvider client={client}>
      <div>
        <PostForm />
        <PostsList />
      </div>
    </GrafooProvider>
  );

  render(<App />, mnt, mnt.lastChild);
}
