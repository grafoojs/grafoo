import graphql from "@grafoo/core/tag";
import {
  CreateAuthorInput,
  DeleteAuthorInput,
  Mutation,
  Query,
  UpdateAuthorInput
} from "@grafoo/test-utils";

export type AuthorQuery = Pick<Query, "author">;
export type AuthorQueryVariables = { id: string };
export let AUTHOR = graphql<AuthorQuery, AuthorQueryVariables>`
  query ($id: ID!) {
    author(id: $id) {
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
`;

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

export type CreateAuthorMutation = Pick<Mutation, "createAuthor">;
export type CreateAuthorMutationVariables = { input: CreateAuthorInput };
export let CREATE_AUTHOR = graphql<CreateAuthorMutation, CreateAuthorMutationVariables>`
  mutation ($input: CreateAuthorInput!) {
    createAuthor(input: $input) {
      author {
        name
      }
    }
  }
`;

export type DeleteAuthorMutation = Pick<Mutation, "deleteAuthor">;
export type DeleteAuthorMutationVariables = { input: DeleteAuthorInput };
export let DELETE_AUTHOR = graphql<DeleteAuthorMutation, DeleteAuthorMutationVariables>`
  mutation ($input: DeleteAuthorInput!) {
    deleteAuthor(input: $input) {
      author {
        name
      }
    }
  }
`;

export type UpdateAuthorMutation = Pick<Mutation, "updateAuthor">;
export type UpdateAuthorMutationVariables = { input: UpdateAuthorInput };
export let UPDATE_AUTHOR = graphql<UpdateAuthorMutation, UpdateAuthorMutationVariables>`
  mutation ($input: UpdateAuthorInput!) {
    updateAuthor(input: $input) {
      author {
        name
      }
    }
  }
`;
