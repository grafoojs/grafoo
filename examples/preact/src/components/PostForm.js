import { h, Component } from "preact";
import { withMutation } from "@grafoo/preact";
import graphql from "@grafoo/loader";

import { Wrapper, H1, Form, Input, Textarea, Button } from "./ui-kit";

class PostForm extends Component {
  constructor(props) {
    super(props);
    this.submit = this.submit.bind(this);
  }

  async submit(event) {
    event.preventDefault();

    const variables = [...event.target.elements].reduce(
      (acc, cur) => (!cur.name ? acc : Object.assign({}, acc, { [cur.name]: cur.value })),
      { authorId: "cjf8wunvn9a090108zyom8xs2" }
    );

    const optimisticUpdate = variables;

    const { data, cache } = await this.props.mutate({ variables, optimisticUpdate });

    cache.write(data);
  }

  render() {
    return (
      <Wrapper>
        <H1>Post Form</H1>
        <Form onSubmit={this.submit}>
          <Input placeholder="title" name="title" />
          <Textarea placeholder="content" name="content" />
          <Button>submit</Button>
        </Form>
      </Wrapper>
    );
  }
}

const mutation = graphql`
  mutation createPost($content: String, $title: String, $authorId: ID) {
    createPost(content: $content, title: $title, authorId: $authorId) {
      id
    }
  }
`;

export default withMutation(mutation)(PostForm);
