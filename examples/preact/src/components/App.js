import { h } from "preact";
import { Provider } from "@grafoo/preact";

import PostsContainer from "./PostsContainer";

export default function App({ client }) {
  return (
    <Provider client={client}>
      <PostsContainer />
    </Provider>
  );
}
