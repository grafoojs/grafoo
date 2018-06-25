import fetchMock from "fetch-mock";
import fs from "fs";
import { graphql, ExecutionResult } from "graphql";
import { makeExecutableSchema } from "graphql-tools";
import path from "path";
import uuid from "uuid/v4";
import setupDB from "./db";

const db = setupDB();

const typeDefs = fs.readFileSync(path.join(__dirname, "..", "schema.graphql"), "utf-8");

const Query = {
  author(_, args) {
    return db
      .get("authors")
      .find({ id: args.id })
      .value();
  },
  authors() {
    return db.get("authors").value();
  },
  post(_, args) {
    return db
      .get("posts")
      .find({ id: args.id })
      .value();
  },
  posts() {
    return db.get("posts").value();
  }
};

const Mutation = {
  createAuthor(_, args) {
    const newAuthor = Object.assign({}, args, { id: uuid() });

    db.get("authors")
      .push(newAuthor)
      .write();

    return newAuthor;
  },
  updateAuthor(_, args) {
    return db
      .get("authors")
      .find({ id: args.id })
      .assign(args)
      .write();
  },
  deleteAuthor(_, args) {
    const author = db
      .get("authors")
      .find(args)
      .value();

    db.get("authors")
      .find(args)
      .remove()
      .write();

    db.get("posts")
      .find({ author: args.id })
      .remove()
      .write();

    return author;
  },
  createPost(_, args) {
    const newPost = Object.assign({}, args, { id: uuid() });

    db.get("posts")
      .push(newPost)
      .write();

    return newPost;
  },
  updatePost(_, args) {
    return db
      .get("posts")
      .find({ id: args.id })
      .assign(args)
      .write();
  },
  deletePost(_, args) {
    const post = db
      .get("posts")
      .find(args)
      .value();

    db.get("posts")
      .find(args)
      .remove()
      .write();

    return post;
  }
};

const Author = {
  posts(author) {
    return author.posts
      ? author.posts.map(function(id) {
          return db
            .get("posts")
            .find({ id: id })
            .value();
        })
      : null;
  }
};

const Post = {
  author(post) {
    return db
      .get("authors")
      .find({ id: post.author })
      .value();
  }
};

const resolvers = {
  Query: Query,
  Mutation: Mutation,
  Author: Author,
  Post: Post
};

const schema = makeExecutableSchema({ typeDefs: typeDefs, resolvers: resolvers });

interface ExecuteQueryArg {
  query: string;
  variables: {
    [key: string]: any;
  };
}

export const executeQuery = ({ query, variables }: ExecuteQueryArg): Promise<ExecutionResult> =>
  graphql({ schema: schema, source: query, variableValues: variables });

export function mockQueryRequest(request: ExecuteQueryArg): Promise<ExecutionResult> {
  fetchMock.reset();
  fetchMock.restore();

  return executeQuery(request).then(function(response) {
    fetchMock.post("*", response);

    return response;
  });
}
