import React from "react";

import { Provider } from "../context";
import PostsContainer from "./PostsContainer";

export default function App() {
  return (
    <Provider>
      <PostsContainer />
    </Provider>
  );
}
