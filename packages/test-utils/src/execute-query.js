import fs from "fs";
import path from "path";
import uuid from "uuid/v4";
import { graphql } from "graphql";
import { makeExecutableSchema } from "graphql-tools";

import setupDB from "./db";

const db = setupDB();

const typeDefs = fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf-8");

const resolvers = {
  Query: {
    author: (_, { id }) =>
      db
        .get("authors")
        .find({ id })
        .value(),
    authors: () => db.get("authors").value(),
    post: (_, { id }) =>
      db
        .get("posts")
        .find({ id })
        .value(),
    posts: () => db.get("posts").value()
  },
  Mutation: {
    createAuthor: (_, args) =>
      db
        .get("authors")
        .push({ ...args, id: uuid() })
        .write(),
    updateAuthor: (_, { id, ...args }) =>
      db
        .get("authors")
        .find({ id })
        .update(args)
        .write(),
    deleteAuthor: (_, args) => {
      const author = db
        .get("authors")
        .find(args)
        .remove()
        .write();

      db
        .get("posts")
        .find({ author: args.id })
        .remove()
        .write();

      return author;
    },
    createPost: (_, args) =>
      db
        .get("posts")
        .push({ ...args, id: uuid() })
        .write(),
    updatePost: (_, { id, ...args }) =>
      db
        .get("posts")
        .find({ id })
        .update(args)
        .write(),
    deletePost: (_, args) =>
      db
        .get("posts")
        .find(args)
        .remove()
        .write()
  },
  Author: {
    posts: author =>
      author.posts.map(id =>
        db
          .get("posts")
          .find({ id })
          .value()
      )
  },
  Post: {
    author: post =>
      db
        .get("authors")
        .find({ id: post.author })
        .value()
  }
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

export const executeQuery = ({ query, variables }) =>
  graphql({ schema, source: query, variableValues: variables });
