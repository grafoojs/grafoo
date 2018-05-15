import { h, Component } from "preact";
import { Mutation } from "@grafoo/preact";

import { allPosts, createPost } from "../queries";
import { Wrapper, H1, Form, Input, Textarea, Button } from "./ui-kit";

class PostFormQuery extends Component {
  constructor(props) {
    super(props);

    this.state = { title: "", content: "" };
    this.submit = this.submit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(value) {
    return event => this.setState({ [value]: event.target.value });
  }

  async submit(event) {
    event.preventDefault();

    const { mutate, client } = this.props;

    // crutial to perform the optmistic update
    const tempId = Math.random()
      .toString(36)
      .substr(2, 5);

    // new post from state
    const newPost = Object.assign({ id: tempId }, this.state);

    // get allPosts query data from client
    const { data } = client.read({ query: allPosts });

    // optimistic update with data from form
    client.write({ query: allPosts }, { allPosts: [newPost, ...data.allPosts] });

    // empty state
    this.setState({ title: "", content: "" });

    // perform mutation on the server
    const { createPost: postFromServer } = await mutate(newPost);

    // update cache
    client.write({ query: allPosts }, { allPosts: [postFromServer, ...data.allPosts] });
  }

  render(props, { title, content }) {
    return (
      <Wrapper>
        <H1>Post Form</H1>
        <Form onSubmit={this.submit}>
          <Input placeholder="title" value={title} onInput={this.handleChange("title")} />
          <Textarea placeholder="content" value={content} onInput={this.handleChange("content")} />
          <Button>submit</Button>
        </Form>
      </Wrapper>
    );
  }
}

export default function PostForm() {
  return <Mutation query={createPost}>{props => <PostFormQuery {...props} />}</Mutation>;
}
