import graphql from "@grafoo/loader";

export const Author = graphql`
  query($id: ID!) {
    author(id: $id) {
      id
      name
      posts {
        id
        title
        body
      }
    }
  }
`;

export const Authors = graphql`
  query {
    authors {
      id
      name
      posts {
        id
        title
        body
        author {
          id
          name
        }
      }
    }
  }
`;

export const Post = graphql`
  query($id: ID!) {
    post(id: $id) {
      id
      title
      body
      author {
        id
        name
      }
    }
  }
`;

export const Posts = graphql`
  query {
    posts {
      id
      title
      body
      author {
        id
        name
      }
    }
  }
`;
