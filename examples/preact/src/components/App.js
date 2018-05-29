import { h } from "preact";
import { GrafooProvider } from "@grafoo/preact";

import PostsContainer from "./PostsContainer";

export default function App({ client }) {
  return (
    <GrafooProvider client={client}>
      <PostsContainer />
    </GrafooProvider>
  );
}
