import React, { Component, Fragment } from "react";
import { Button, Form, H1, Input, Textarea, Wrapper, H2, Item, List } from "./ui-kit";

export default class Posts extends Component {
  state = { title: "", content: "", id: null };

  handleChange = value => event => this.setState({ [value]: event.target.value });

  submit = event => {
    event.preventDefault();

    const submit = this.props[this.state.id ? "updatePost" : "createPost"];

    submit(this.state).then(() => this.setState({ title: "", content: "", id: null }));
  };

  render() {
    const { loaded, allPosts, deletePost } = this.props;
    const { title, content } = this.state;

    return (
      <Fragment>
        <Wrapper>
          <H1>Post Form</H1>
          <Form onSubmit={this.submit}>
            <Input placeholder="title" value={title} onInput={this.handleChange("title")} />
            <Textarea
              placeholder="content"
              value={content}
              onInput={this.handleChange("content")}
            />
            <Button>submit</Button>
          </Form>
        </Wrapper>
        {loaded ? (
          <List>
            {allPosts.map(({ id, title, content }) => (
              <Item key={id}>
                <Wrapper>
                  <H2>{title}</H2>
                  <div dangerouslySetInnerHTML={{ __html: content }} style={{ marginBottom: 16 }} />
                  <Button onClick={() => this.setState({ id, title, content })}>
                    update post
                  </Button>{" "}
                  <Button onClick={() => deletePost({ id })}>remove post</Button>
                </Wrapper>
              </Item>
            ))}
          </List>
        ) : (
          <Wrapper>loading...</Wrapper>
        )}
      </Fragment>
    );
  }
}
