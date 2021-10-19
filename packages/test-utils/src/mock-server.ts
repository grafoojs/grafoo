import { GraphQlPayload } from "@grafoo/core";
import fetchMock from "fetch-mock";
import fs from "fs";
import { graphql } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import path from "path";
import { v4 as uuid } from "uuid";
import setupDB from "./db";

let db = setupDB();

let typeDefs = fs.readFileSync(path.join(__dirname, "..", "schema.graphql"), "utf-8");

let Query = {
  author(_, args) {
    return db.data.authors.find((author) => author.id === args.id);
  },
  authors(_, args) {
    let { authors } = db.data;
    return authors.slice(args.from ?? 0, args.to ?? authors.length);
  },
  post(_, args) {
    return db.data.posts.find((post) => post.id === args.id);
  },
  posts(_, args) {
    let { posts } = db.data;
    return posts.slice(args.from ?? 0, args.to ?? posts.length);
  }
};

let Mutation = {
  createAuthor(_, args) {
    let newAuthor = Object.assign({}, args, { id: uuid() });

    db.data.authors.push(newAuthor);

    db.write();

    return newAuthor;
  },
  updateAuthor(_, args) {
    let author = Object.assign(
      db.data.authors.find((author) => author.id === args.id),
      args
    );

    db.write();

    return author;
  },
  deleteAuthor(_, args) {
    let author = db.data.authors.find(args);

    db.data.authors = db.data.authors.filter((a) => a.id !== author.id);
    db.data.posts = db.data.posts.filter((p) => p.author !== author.id);

    db.write();

    return author;
  },
  createPost(_, args) {
    let newPost = Object.assign({}, args, { id: uuid() });

    db.data.posts.push(newPost);

    db.write();

    return newPost;
  },
  updatePost(_, args) {
    let post = Object.assign(
      db.data.posts.find((author) => author.id === args.id),
      args
    );

    db.write();

    return post;
  },
  deletePost(_, args) {
    let post = db.data.posts.find(args);

    db.data.posts = db.data.posts.filter((p) => p.id !== args.id);

    db.write();

    return post;
  }
};

let Author = {
  posts(author, args) {
    let posts = author.posts
      ? author.posts.map((id) => db.data.posts.find((post) => post.id === id))
      : null;

    return posts.slice(args.from ?? 0, args.to ?? posts.length);
  }
};

let Post = {
  author(post) {
    return db.data.authors.find((author) => author.id === post.author);
  }
};

let resolvers = {
  Query: Query,
  Mutation: Mutation,
  Author: Author,
  Post: Post
};

let schema = makeExecutableSchema({ typeDefs: typeDefs, resolvers: resolvers });

type ExecuteQueryArg = {
  query: string;
  variables?: {
    [key: string]: unknown;
  };
};

export function executeQuery<T>({ query, variables }: ExecuteQueryArg): Promise<GraphQlPayload<T>> {
  // @ts-ignore
  return graphql({ schema: schema, source: query, variableValues: variables });
}

export async function mockQueryRequest<T>(request: ExecuteQueryArg): Promise<GraphQlPayload<T>> {
  fetchMock.reset();
  fetchMock.restore();

  let response = await executeQuery<T>(request);
  fetchMock.post("*", response);

  return response;
}
