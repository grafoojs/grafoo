import { GraphQlPayload } from "@grafoo/types";
import fetchMock from "fetch-mock";
import fs from "fs";
import { graphql } from "graphql";
import { makeExecutableSchema } from "graphql-tools";
import path from "path";
import { v4 as uuid } from "uuid";
import setupDB from "./db";

const db = setupDB();

const typeDefs = fs.readFileSync(path.join(__dirname, "..", "schema.graphql"), "utf-8");

const Query = {
  author(_, args) {
    return db.get("authors").find({ id: args.id }).value();
  },
  authors() {
    return db.get("authors").value();
  },
  post(_, args) {
    return db.get("posts").find({ id: args.id }).value();
  },
  posts() {
    return db.get("posts").value();
  },
};

const Mutation = {
  createAuthor(_, args) {
    let newAuthor = Object.assign({}, args, { id: uuid() });

    db.get("authors").push(newAuthor).write();

    return newAuthor;
  },
  updateAuthor(_, args) {
    return db.get("authors").find({ id: args.id }).assign(args).write();
  },
  deleteAuthor(_, args) {
    let author = db.get("authors").find(args).value();

    db.get("authors").find(args).remove().write();

    db.get("posts").find({ author: args.id }).remove().write();

    return author;
  },
  createPost(_, args) {
    let newPost = Object.assign({}, args, { id: uuid() });

    db.get("posts").push(newPost).write();

    return newPost;
  },
  updatePost(_, args) {
    return db.get("posts").find({ id: args.id }).assign(args).write();
  },
  deletePost(_, args) {
    let post = db.get("posts").find(args).value();

    db.get("posts").find(args).remove().write();

    return post;
  },
};

const Author = {
  posts(author) {
    return author.posts
      ? author.posts.map(function (id) {
          return db.get("posts").find({ id: id }).value();
        })
      : null;
  },
};

const Post = {
  author(post) {
    return db.get("authors").find({ id: post.author }).value();
  },
};

const resolvers = {
  Query: Query,
  Mutation: Mutation,
  Author: Author,
  Post: Post,
};

const schema = makeExecutableSchema({ typeDefs: typeDefs, resolvers: resolvers });

interface ExecuteQueryArg {
  query: string;
  variables?: {
    [key: string]: unknown;
  };
}

export function executeQuery<T>({ query, variables }: ExecuteQueryArg): Promise<GraphQlPayload<T>> {
  // @ts-ignore
  return graphql({ schema: schema, source: query, variableValues: variables });
}

export function mockQueryRequest<T>(request: ExecuteQueryArg): Promise<GraphQlPayload<T>> {
  fetchMock.reset();
  fetchMock.restore();

  return executeQuery<T>(request).then(function (response) {
    fetchMock.post("*", response);

    return response;
  });
}
