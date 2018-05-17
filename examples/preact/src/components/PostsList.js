import { h, Component } from "preact";
import { Query, Mutation } from "@grafoo/preact";

import { allPosts, deletePost } from "../queries";
import { Ul, Li, H2, Wrapper, Button } from "./ui-kit";

class PostsList extends Component {
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
        render={({ allPosts, loading, loaded, errors }) => {
          console.log({ allPosts, loading, loaded, errors });

          if (loading) return <Wrapper>loading...</Wrapper>;

          return (
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
          );
        }}
      />
    );
  }
}

export default function PostsListWrapper() {
  return <Mutation query={deletePost} render={props => <PostsList {...props} />} />;
}
