import fs from "fs";
import path from "path";
import { graphql } from "graphql";
import { makeExecutableSchema } from "graphql-tools";

import setupDB from "./db";

const db = setupDB();

const typeDefs = fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf-8");

const resolvers = {
  Query: {
    post: (_, { id }) =>
      db
        .get("posts")
        .find({ id })
        .value(),
    posts: () => db.get("posts").value(),
    author: (_, { id }) =>
      db
        .get("authors")
        .find({ id })
        .value(),
    authors: () => db.get("authors").value()
  },
  Post: {
    author: post =>
      db
        .get("authors")
        .find({ id: post.author })
        .value()
  },
  Author: {
    posts: author =>
      author.posts.map(id =>
        db
          .get("posts")
          .find({ id })
          .value()
      )
  }
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

export default ({ query, variables }) =>
  graphql({ schema, source: query, variableValues: variables });
