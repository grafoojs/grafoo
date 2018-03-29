import { h } from "preact";
import { Mutation } from "@grafoo/preact";
import graphql from "@grafoo/loader";

import { Wrapper, H1, Form, Input, Textarea, Button } from "./ui-kit";

function handleSubmit(mutate) {
  return async event => {
    event.preventDefault();

    const variables = [...event.target.elements].reduce(
      (acc, cur) => (!cur.name ? acc : Object.assign({}, acc, { [cur.name]: cur.value })),
      { authorId: "cjf8wunvn9a090108zyom8xs2" }
    );

    const optimisticUpdate = Object.assign({}, variables, { id: "tempID" });

    const { data, cache } = await mutate({ variables, optimisticUpdate });

    cache.write(data);
  };
}

const mutation = graphql`
  mutation createPost($content: String, $title: String, $authorId: ID) {
    createPost(content: $content, title: $title, authorId: $authorId) {
      title
      content
      id
    }
  }
`;

export default function PostForm() {
  return (
    <Mutation query={mutation}>
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
