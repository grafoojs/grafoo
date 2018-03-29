import { h } from "preact";
import { Mutation } from "@grafoo/preact";

import { allPosts, createPost } from "../queries";
import { Wrapper, H1, Form, Input, Textarea, Button } from "./ui-kit";

function handleSubmit(client, mutate) {
  return async event => {
    event.preventDefault();

    const tempId = Math.random()
      .toString(36)
      .substring(2, 7);

    const elements = [...event.target.elements];

    const newPost = elements.reduce(
      (acc, cur) => (!cur.name ? acc : Object.assign({}, acc, { [cur.name]: cur.value })),
      {
        authorId: "cjf8wunvn9a090108zyom8xs2",
        id: tempId
      }
    );

    elements.forEach(_ => (_.value = ""));

    const { data: fromCache } = client.read({ query: allPosts });

    client.write({ query: allPosts }, { allPosts: [newPost, ...fromCache.allPosts] });

    const { data: fromServer } = await mutate({ variables: newPost });

    client.write({ query: allPosts }, { allPosts: [fromServer.createPost, ...fromCache.allPosts] });
  };
}

export default function PostForm() {
  return (
    <Mutation query={createPost}>
      {({ mutate, client }) => (
        <Wrapper>
          <H1>Post Form</H1>
          <Form onSubmit={handleSubmit(client, mutate)}>
            <Input placeholder="title" name="title" />
            <Textarea placeholder="content" name="content" />
            <Button>submit</Button>
          </Form>
        </Wrapper>
      )}
    </Mutation>
  );
}
