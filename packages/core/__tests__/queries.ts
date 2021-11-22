import graphql from "@grafoo/core/tag";
import { Query, QueryPostArgs } from "@grafoo/test-utils";

export type AuthorsQuery = Pick<Query, "authors">;

export let AUTHORS = graphql<AuthorsQuery>`
  query {
    authors {
      edges {
        node {
          name
          posts {
            edges {
              node {
                body
                title
              }
            }
          }
        }
      }
    }
  }
`;

export let SIMPLE_AUTHORS = graphql<AuthorsQuery>`
  query {
    authors {
      edges {
        node {
          name
        }
      }
    }
  }
`;

export type PostsAndAuthorsQuery = Pick<Query, "authors" | "posts">;

export let POSTS_AND_AUTHORS = graphql<PostsAndAuthorsQuery>`
  query {
    posts {
      edges {
        node {
          title
          body
          author {
            name
          }
        }
      }
    }

    authors {
      edges {
        node {
          name
          posts {
            edges {
              node {
                body
                title
              }
            }
          }
        }
      }
    }
  }
`;

export type PostQuery = Pick<Query, "post">;

export let POST = graphql<PostQuery, QueryPostArgs>`
  query ($id: ID!) {
    post(id: $id) {
      title
      body
      author {
        name
      }
    }
  }
`;

export let POST_WITH_FRAGMENT = graphql<PostQuery, QueryPostArgs>`
  query ($id: ID!) {
    post(id: $id) {
      title
      body
      author {
        ...AuthorInfo
      }
    }
  }

  fragment AuthorInfo on Author {
    name
  }
`;

export type PostsQuery = Pick<Query, "posts">;

export let POSTS = graphql<PostsQuery>`
  query {
    posts {
      edges {
        node {
          title
          body
          author {
            name
          }
        }
      }
    }
  }
`;
