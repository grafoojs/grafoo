import { GraphQlPayload } from "@grafoo/core";
import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  graphql
} from "graphql";
import {
  connectionArgs,
  connectionDefinitions,
  connectionFromArray,
  fromGlobalId,
  globalIdField,
  mutationWithClientMutationId,
  nodeDefinitions
} from "graphql-relay";
import { v4 as uuid } from "uuid";
import fetchMock from "fetch-mock";
import setupDB from "./db";

let db = setupDB();

let { nodeInterface, nodeField } = nodeDefinitions(
  (globalId) => {
    let { type, id } = fromGlobalId(globalId);

    switch (type) {
      case "Author":
        return db.data.authors.find((author) => author.id === id);
      case "Post":
        return db.data.posts.find((post) => post.id === id);
    }
  },
  (obj) => (obj.name ? authorType : postType)
);

let authorType = new GraphQLObjectType({
  name: "Author",
  interfaces: [nodeInterface],
  fields: () => ({
    id: globalIdField(),
    name: { type: new GraphQLNonNull(GraphQLString) },
    posts: {
      type: postConnection,
      args: connectionArgs,
      resolve: (author, args) =>
        connectionFromArray(
          author.posts.map((id) => db.data.posts.find((p) => p.id === id)),
          args
        )
    }
  })
});

let { connectionType: authorConnection } = connectionDefinitions({ nodeType: authorType });

let postType = new GraphQLObjectType({
  name: "Post",
  interfaces: [nodeInterface],
  fields: () => ({
    id: globalIdField(),
    title: { type: new GraphQLNonNull(GraphQLString) },
    body: { type: new GraphQLNonNull(GraphQLString) },
    author: {
      type: new GraphQLNonNull(authorType),
      resolve: (post) => db.data.authors.find((a) => a.id === post.author)
    }
  })
});

let { connectionType: postConnection } = connectionDefinitions({ nodeType: postType });

let queryType = new GraphQLObjectType({
  name: "Query",
  fields: () => ({
    author: {
      type: authorType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) }
      },
      resolve: (_, args) => {
        let { id } = fromGlobalId(args.id);
        return db.data.authors.find((a) => a.id === id);
      }
    },
    authors: {
      type: authorConnection,
      args: connectionArgs,
      resolve: (_, args) => connectionFromArray(db.data.authors, args)
    },
    post: {
      type: postType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) }
      },
      resolve: (_, args) => {
        let { id } = fromGlobalId(args.id);
        return db.data.posts.find((a) => a.id === id);
      }
    },
    posts: {
      type: postConnection,
      args: connectionArgs,
      resolve: (_, args) => connectionFromArray(db.data.posts, args)
    },
    node: nodeField
  })
});

let createAuthor = mutationWithClientMutationId({
  name: "CreateAuthor",
  inputFields: {
    name: { type: new GraphQLNonNull(GraphQLString) }
  },
  outputFields: {
    author: {
      type: authorType,
      resolve: (id) => db.data.authors.find((a) => a.id === id)
    }
  },
  mutateAndGetPayload: (args) => {
    let id = uuid();
    let newAuthor = Object.assign({}, args, { id });
    db.data.authors.push(newAuthor);
    db.write();
    return id;
  }
});

let updateAuthor = mutationWithClientMutationId({
  name: "UpdateAuthor",
  inputFields: {
    id: { type: GraphQLID },
    name: { type: GraphQLString }
  },
  outputFields: {
    author: {
      type: authorType,
      resolve: (id) => db.data.authors.find((a) => a.id === id)
    }
  },
  mutateAndGetPayload: (args) => {
    let { id } = fromGlobalId(args.id);
    Object.assign(
      db.data.authors.find((a) => a.id === id),
      args
    );
    db.write();
    return args.id;
  }
});

let deleteAuthor = mutationWithClientMutationId({
  name: "DeleteAuthor",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    author: {
      type: authorType,
      resolve: (author) => author
    }
  },
  mutateAndGetPayload: (args) => {
    let { id } = fromGlobalId(args.id);
    let author = db.data.authors.find((a) => a.id === id);
    db.data.authors = db.data.authors.filter((a) => a.id !== author.id);
    db.data.posts = db.data.posts.filter((p) => p.author !== author.id);
    db.write();
    return author;
  }
});

let createPost = mutationWithClientMutationId({
  name: "CreatePost",
  inputFields: {
    title: { type: new GraphQLNonNull(GraphQLString) },
    body: { type: GraphQLString },
    authorId: { type: new GraphQLNonNull(GraphQLID) }
  },
  outputFields: {
    post: {
      type: postType,
      resolve: (id) => db.data.posts.find((p) => p.id === id)
    }
  },
  mutateAndGetPayload: (args) => {
    let id = uuid();
    db.data.authors.find((a) => a.id === args.authorId).posts.push(id);
    let newPost = { title: args.title, body: args.body, author: args.authorId, id };
    db.data.posts.push(newPost);
    db.write();
    return id;
  }
});

let updatePost = mutationWithClientMutationId({
  name: "UpdatePost",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    title: { type: GraphQLString },
    body: { type: GraphQLString }
  },
  outputFields: {
    post: {
      type: postType,
      resolve: (id) => db.data.posts.find((p) => p.id === id)
    }
  },
  mutateAndGetPayload: (args) => {
    Object.assign(
      db.data.posts.find((p) => p.id === args.id),
      args
    );
    db.write();
    return args.id;
  }
});

let deletePost = mutationWithClientMutationId({
  name: "DeletePost",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLID) }
  },
  outputFields: {
    post: {
      type: postType,
      resolve: (post) => post
    }
  },
  mutateAndGetPayload: (args) => {
    let post = db.data.posts.find((p) => p.id === args.id);
    let author = db.data.authors.find((a) => a.id === post.author);
    author.posts = author.posts.filter((p) => p !== post.id);
    db.data.posts = db.data.posts.filter((p) => p.id !== args.id);
    db.write();
    return post;
  }
});

let mutationType = new GraphQLObjectType({
  name: "Mutation",
  fields: () => ({
    createAuthor,
    updateAuthor,
    deleteAuthor,
    createPost,
    updatePost,
    deletePost
  })
});

let schema = new GraphQLSchema({ query: queryType, mutation: mutationType });

type ExecuteQueryArg = {
  query: string;
  variables?: Record<string, unknown>;
};

export function executeQuery<T>({ query, variables }: ExecuteQueryArg): Promise<GraphQlPayload<T>> {
  // @ts-ignore
  return graphql({ schema: schema, source: query, variableValues: variables });
}

export async function mockQueryRequest<T>(
  query: { document: string },
  variables?: Record<string, unknown>
): Promise<GraphQlPayload<T>> {
  fetchMock.reset();
  fetchMock.restore();

  let response = await executeQuery<T>({ query: query.document, variables });
  fetchMock.post("*", response);

  return response;
}
