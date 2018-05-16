import gql from "@grafoo/tag";
import casual from "casual";
import fetchMock from "fetch-mock";
import fs from "fs";
import { graphql } from "graphql";
import { makeExecutableSchema } from "graphql-tools";
import low from "lowdb";
import MemoryAdapter from "lowdb/adapters/Memory";
import path from "path";
import uuid from "uuid/v4";

casual.seed(666);

const times = (t, fn) => Array.from(Array(t), fn);

function setupDB() {
  const db = low(new MemoryAdapter());

  db.defaults({ posts: [], authors: [] }).write();

  times(2, () =>
    db
      .get("authors")
      .push({
        id: casual.uuid,
        name: casual.first_name + " " + casual.last_name
      })
      .write()
  );

  db
    .get("authors")
    .value()
    .forEach(({ id }) => {
      times(4, () =>
        db
          .get("posts")
          .push({
            author: id,
            id: casual.uuid,
            title: casual.title,
            body: casual.short_description
          })
          .write()
      );

      const posts = db
        .get("posts")
        .filter(post => post.author === id)
        .map(post => post.id)
        .value();

      db
        .get("authors")
        .find({ id })
        .set("posts", posts)
        .write();
    });

  return db;
}

const db = setupDB();

const typeDefs = fs.readFileSync(path.join(__dirname, "..", "schema.graphql"), "utf-8");

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

export const PostsAndAuthors = gql`
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

export const Post = gql`
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

export const Posts = gql`
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

export const Author = gql`
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

export const Authors = gql`
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

export function makeMockRequest(request) {
  fetchMock.reset();
  fetchMock.restore();

  return executeQuery(request).then(response => {
    fetchMock.post("*", response);

    return response;
  });
}
