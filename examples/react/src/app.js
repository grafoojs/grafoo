import React from "react";
import { Provider } from "@grafoo/react";
import PostsContainer from "./posts-container";

export default function App({ client }) {
  return (
    <Provider client={client}>
      <PostsContainer />
    </Provider>
  );
}
