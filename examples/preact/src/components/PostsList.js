import { h } from "preact";
import { Query } from "@grafoo/preact";
import graphql from "@grafoo/loader";

import { Ul, Li, H2, Wrapper } from "./ui-kit";

const query = graphql`
  query {
    allPosts(orderBy: createdAt_DESC) {
      title
      content
      createdAt
      updatedAt
    }
  }
`;

export default function PostsList() {
  return (
    <Query query={query}>
      {({ data, loading }) => {
        if (loading) return <Wrapper>loading...</Wrapper>;

        return (
          <Ul>
            {data.allPosts.map(post => (
              <Li key={post.id}>
                <Wrapper>
                  <H2>{post.title}</H2>
                  <div dangerouslySetInnerHTML={{ __html: post.content }} />
                </Wrapper>
              </Li>
            ))}
          </Ul>
        );
      }}
    </Query>
  );
}
