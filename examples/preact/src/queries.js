import gql from "@grafoo/core/tag";

export const allPosts = gql`
  query getPosts {
    allPosts(orderBy: createdAt_DESC) {
      title
      content
      createdAt
      updatedAt
    }
  }
`;

export const createPost = gql`
  mutation createPost($content: String, $title: String, $authorId: ID) {
    createPost(content: $content, title: $title, authorId: $authorId) {
      title
      content
      createdAt
      updatedAt
    }
  }
`;

export const updatePost = gql`
  mutation updatePost($id: ID!, $title: String, $content: String) {
    updatePost(id: $id, title: $title, content: $content) {
      title
      content
      createdAt
      updatedAt
    }
  }
`;

export const deletePost = gql`
  mutation deletePost($id: ID!) {
    deletePost(id: $id) {
      id
    }
  }
`;
