import { h, Component } from "preact";
import { Button, Form, H1, Input, Textarea, Wrapper } from "./ui-kit";

export default class PostForm extends Component {
  constructor(props) {
    super(props);

    this.state = { title: "", content: "" };
    this.handleChange = this.handleChange.bind(this);
    this.submit = this.submit.bind(this);
  }

  handleChange(value) {
    return event => this.setState({ [value]: event.target.value });
  }

  submit(e) {
    e.preventDefault();
    this.props.submit(this.state).then(() => this.setState({ title: "", content: "" }));
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
