import { h } from "preact";
import { Query, withMutation } from "@grafoo/preact";

import { allPosts, deletePost } from "../queries";
import { Ul, Li, H2, Wrapper, Button } from "./ui-kit";

function removePost(mutate, id, client) {
  return event => {
    event.preventDefault();

    const { data } = client.read({ query: allPosts });

    client.write({ query: allPosts }, { allPosts: data.allPosts.filter(_ => _.id !== id) });

    mutate({ variables: { id } });
  };
}

export default withMutation(deletePost)(function PostsList(props) {
  return (
    <Query query={allPosts}>
      {({ data, loading }) => {
        if (loading) return <Wrapper>loading...</Wrapper>;

        return (
          <Ul>
            {data.allPosts.map(post => (
              <Li key={post.id}>
                <Wrapper>
                  <H2>{post.title}</H2>
                  <div dangerouslySetInnerHTML={{ __html: post.content }} />
                  <br />
                  <Button onClick={removePost(props.mutate, post.id, props.client)}>
                    update post
                  </Button>{" "}
                  <Button onClick={removePost(props.mutate, post.id, props.client)}>
                    remove post
                  </Button>
                </Wrapper>
              </Li>
            ))}
          </Ul>
        );
      }}
    </Query>
  );
});
