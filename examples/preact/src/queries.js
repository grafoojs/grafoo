import graphql from "@grafoo/loader";

export const allPosts = graphql`
  query {
    allPosts(orderBy: createdAt_DESC) {
      title
      content
      createdAt
      updatedAt
    }
  }
`;

export const createPost = graphql`
  mutation createPost($content: String, $title: String, $authorId: ID) {
    createPost(content: $content, title: $title, authorId: $authorId) {
      title
      content
    }
  }
`;

export const updatePost = graphql`
  mutation updatePost($id: ID!, $title: String, $content: String) {
    updatePost(id: $id, title: $title, content: $content) {
      title
      content
    }
  }
`;

export const deletePost = graphql`
  mutation deletePost($id: ID!) {
    deletePost(id: $id) {
      id
    }
  }
`;
