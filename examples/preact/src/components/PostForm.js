import { h } from "preact";
import { Mutation } from "@grafoo/preact";

import { allPosts, createPost } from "../queries";
import { Wrapper, H1, Form, Input, Textarea, Button } from "./ui-kit";

function handleSubmit(mutate) {
  return async event => {
    event.preventDefault();

    const elements = [...event.target.elements];

    const newPost = elements.reduce(
      (acc, cur) => (!cur.name ? acc : Object.assign({}, acc, { [cur.name]: cur.value })),
      { authorId: "cjf8wunvn9a090108zyom8xs2" }
    );

    elements.forEach(_ => (_.value = ""));

    const { data: fromServer, cache } = await mutate({ variables: newPost });
    const { data: fromCache } = cache.read({ query: allPosts });

    cache.write({ query: allPosts }, { allPosts: [fromServer.createPost, ...fromCache.allPosts] });
  };
}

export default function PostForm() {
  return (
    <Mutation query={createPost}>
      {({ mutate }) => (
        <Wrapper>
          <H1>Post Form</H1>
          <Form onSubmit={handleSubmit(mutate)}>
            <Input placeholder="title" name="title" />
            <Textarea placeholder="content" name="content" />
            <Button>submit</Button>
          </Form>
        </Wrapper>
      )}
    </Mutation>
  );
}
