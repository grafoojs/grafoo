import { h } from "preact";
import { Provider } from "@grafoo/preact";

import PostsList from "./PostsList";
import PostForm from "./PostForm";

export default function App({ client }) {
  return (
    <Provider client={client}>
      <div>
        <PostForm />
        <PostsList />
      </div>
    </Provider>
  );
}
