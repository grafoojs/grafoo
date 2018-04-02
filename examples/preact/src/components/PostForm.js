import { h } from "preact";
import { Mutation } from "@grafoo/preact";

import { allPosts, createPost } from "../queries";
import { Wrapper, H1, Form, Input, Textarea, Button } from "./ui-kit";

export default function PostForm() {
  return (
    <Mutation query={createPost}>
      {({ mutate, client }) => {
        async function handleSubmit(event) {
          event.preventDefault();

          const elements = Array.prototype.slice.call(event.target.elements);

          // crutial to perform the optmistic update
          const tempId = Math.random()
            .toString(36)
            .substr(2, 5);

          // get variables from form
          const newPost = elements.reduce(
            (acc, cur) => (!cur.name ? acc : Object.assign({}, acc, { [cur.name]: cur.value })),
            { id: tempId }
          );

          // empty form
          elements.forEach(_ => (_.value = ""));

          // get allPosts query data from client
          const { data } = client.read({ query: allPosts });

          // optimistic update with data from form
          client.write({ query: allPosts }, { allPosts: [newPost, ...data.allPosts] });

          // perform mutation on the server
          const { createPost: postFromServer } = await mutate({ variables: newPost });

          // update cache
          client.write({ query: allPosts }, { allPosts: [postFromServer, ...data.allPosts] });
        }

        return (
          <Wrapper>
            <H1>Post Form</H1>
            <Form onSubmit={handleSubmit}>
              <Input placeholder="title" name="title" />
              <Textarea placeholder="content" name="content" />
              <Button>submit</Button>
            </Form>
          </Wrapper>
        );
      }}
    </Mutation>
  );
}
