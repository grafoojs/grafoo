export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };

export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Query = {
  __typename?: "Query";
  author?: Maybe<Author>;
  authors?: Maybe<AuthorConnection>;
  post?: Maybe<Post>;
  posts?: Maybe<PostConnection>;
  node?: Maybe<Node>;
};

export type QueryAuthorArgs = {
  id: Scalars["ID"];
};

export type QueryAuthorsArgs = {
  after?: Maybe<Scalars["String"]>;
  first?: Maybe<Scalars["Int"]>;
  before?: Maybe<Scalars["String"]>;
  last?: Maybe<Scalars["Int"]>;
};

export type QueryPostArgs = {
  id: Scalars["ID"];
};

export type QueryPostsArgs = {
  after?: Maybe<Scalars["String"]>;
  first?: Maybe<Scalars["Int"]>;
  before?: Maybe<Scalars["String"]>;
  last?: Maybe<Scalars["Int"]>;
};

export type QueryNodeArgs = {
  id: Scalars["ID"];
};

export type Author = Node & {
  __typename?: "Author";
  id: Scalars["ID"];
  name: Scalars["String"];
  posts?: Maybe<PostConnection>;
};

export type AuthorPostsArgs = {
  after?: Maybe<Scalars["String"]>;
  first?: Maybe<Scalars["Int"]>;
  before?: Maybe<Scalars["String"]>;
  last?: Maybe<Scalars["Int"]>;
};

export type Node = {
  id: Scalars["ID"];
};

export type PostConnection = {
  __typename?: "PostConnection";
  pageInfo: PageInfo;
  edges?: Maybe<Array<Maybe<PostEdge>>>;
};

export type PageInfo = {
  __typename?: "PageInfo";
  hasNextPage: Scalars["Boolean"];
  hasPreviousPage: Scalars["Boolean"];
  startCursor?: Maybe<Scalars["String"]>;
  endCursor?: Maybe<Scalars["String"]>;
};

export type PostEdge = {
  __typename?: "PostEdge";
  node?: Maybe<Post>;
  cursor: Scalars["String"];
};

export type Post = Node & {
  __typename?: "Post";
  id: Scalars["ID"];
  title: Scalars["String"];
  body: Scalars["String"];
  author: Author;
};

export type AuthorConnection = {
  __typename?: "AuthorConnection";
  pageInfo: PageInfo;
  edges?: Maybe<Array<Maybe<AuthorEdge>>>;
};

export type AuthorEdge = {
  __typename?: "AuthorEdge";
  node?: Maybe<Author>;
  cursor: Scalars["String"];
};

export type Mutation = {
  __typename?: "Mutation";
  createAuthor?: Maybe<CreateAuthorPayload>;
  updateAuthor?: Maybe<UpdateAuthorPayload>;
  deleteAuthor?: Maybe<DeleteAuthorPayload>;
  createPost?: Maybe<CreatePostPayload>;
  updatePost?: Maybe<UpdatePostPayload>;
  deletePost?: Maybe<DeletePostPayload>;
};

export type MutationCreateAuthorArgs = {
  input: CreateAuthorInput;
};

export type MutationUpdateAuthorArgs = {
  input: UpdateAuthorInput;
};

export type MutationDeleteAuthorArgs = {
  input: DeleteAuthorInput;
};

export type MutationCreatePostArgs = {
  input: CreatePostInput;
};

export type MutationUpdatePostArgs = {
  input: UpdatePostInput;
};

export type MutationDeletePostArgs = {
  input: DeletePostInput;
};

export type CreateAuthorPayload = {
  __typename?: "CreateAuthorPayload";
  author?: Maybe<Author>;
  clientMutationId?: Maybe<Scalars["String"]>;
};

export type CreateAuthorInput = {
  name: Scalars["String"];
  clientMutationId?: Maybe<Scalars["String"]>;
};

export type UpdateAuthorPayload = {
  __typename?: "UpdateAuthorPayload";
  author?: Maybe<Author>;
  clientMutationId?: Maybe<Scalars["String"]>;
};

export type UpdateAuthorInput = {
  id?: Maybe<Scalars["ID"]>;
  name?: Maybe<Scalars["String"]>;
  clientMutationId?: Maybe<Scalars["String"]>;
};

export type DeleteAuthorPayload = {
  __typename?: "DeleteAuthorPayload";
  author?: Maybe<Author>;
  clientMutationId?: Maybe<Scalars["String"]>;
};

export type DeleteAuthorInput = {
  id: Scalars["ID"];
  clientMutationId?: Maybe<Scalars["String"]>;
};

export type CreatePostPayload = {
  __typename?: "CreatePostPayload";
  post?: Maybe<Post>;
  clientMutationId?: Maybe<Scalars["String"]>;
};

export type CreatePostInput = {
  title: Scalars["String"];
  body?: Maybe<Scalars["String"]>;
  authorId: Scalars["ID"];
  clientMutationId?: Maybe<Scalars["String"]>;
};

export type UpdatePostPayload = {
  __typename?: "UpdatePostPayload";
  post?: Maybe<Post>;
  clientMutationId?: Maybe<Scalars["String"]>;
};

export type UpdatePostInput = {
  id: Scalars["ID"];
  title?: Maybe<Scalars["String"]>;
  body?: Maybe<Scalars["String"]>;
  clientMutationId?: Maybe<Scalars["String"]>;
};

export type DeletePostPayload = {
  __typename?: "DeletePostPayload";
  post?: Maybe<Post>;
  clientMutationId?: Maybe<Scalars["String"]>;
};

export type DeletePostInput = {
  id: Scalars["ID"];
  clientMutationId?: Maybe<Scalars["String"]>;
};
