import graphql from "@grafoo/loader";

export const PostsAndAuthors = graphql`
  query {
    posts {
      title
      body
      author {
        name
      }
    }

    authors {
      name
      posts {
        title
        body
      }
    }
  }
`;

export const Post = graphql`
  query($id: ID!) {
    post(id: $id) {
      title
      body
      author {
        name
      }
    }
  }
`;

export const Posts = graphql`
  query {
    posts {
      title
      body
      author {
        name
      }
    }
  }
`;

export const Author = graphql`
  query($id: ID!) {
    author(id: $id) {
      name
      posts {
        title
        body
      }
    }
  }
`;

export const Authors = graphql`
  query {
    authors {
      name
      posts {
        title
        body
      }
    }
  }
`;
