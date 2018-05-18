import { h, Component } from "preact";
import { Query, Mutation } from "@grafoo/preact";

import { allPosts, deletePost, createPost } from "../queries";
import { Ul, Li, H2, Wrapper, Button } from "./ui-kit";

const mutations = {
  createPost: {
    query: createPost,
    update: (mutate, allPosts, variables) =>
      mutate(variables).then(({ createPost: post }) => ({
        allPosts: [post, ...allPosts]
      })),
    optmisticUpdate: (allPosts, variables) => ({
      allPosts: [variables, ...allPosts]
    })
  },
  removePost: {
    query: createPost,
    optmisticUpdate: ({ allPosts }, { id }) => ({
      allPosts: allPosts.filter(_ => _.id !== id)
    })
  }
};

class PostsList extends Component {
  constructor(props) {
    super(props);

    this.state = { title: "", content: "" };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(value) {
    return event => this.setState({ [value]: event.target.value });
  }

  removePost(mutate, id, client) {
    return event => {
      event.preventDefault();

      const { data } = client.read({ query: allPosts });

      client.write({ query: allPosts }, { allPosts: data.allPosts.filter(_ => _.id !== id) });

      mutate({ id });
    };
  }

  render(props) {
    return (
      <Query
        query={allPosts}
        variables={{ orderBy: "createdAt_DESC" }}
        skipCache={false}
        mutations={mutations}
        render={({ allPosts, loading, loaded, errors }) => {
          // eslint-disable-next-line no-console
          console.log({ allPosts, loading, loaded, errors });

          if (loading) return <Wrapper>loading...</Wrapper>;

          return (
            <div>
              <Ul>
                {allPosts.map(post => (
                  <Li key={post.id}>
                    <Wrapper>
                      <H2>{post.title}</H2>
                      <div dangerouslySetInnerHTML={{ __html: post.content }} />
                      <br />
                      <Button onClick={this.removePost(props.mutate, post.id, props.client)}>
                        update post
                      </Button>{" "}
                      <Button onClick={this.removePost(props.mutate, post.id, props.client)}>
                        remove post
                      </Button>
                    </Wrapper>
                  </Li>
                ))}
              </Ul>
            </div>
          );
        }}
      />
    );
  }
}

export default function PostsListWrapper() {
  return <Mutation query={deletePost} render={props => <PostsList {...props} />} />;
}
