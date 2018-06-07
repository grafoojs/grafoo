import React from "react";
import { Consumer } from "@grafoo/react";

import { allPosts, createPost, deletePost, updatePost } from "./queries";
import Posts from "./posts";

const mutations = {
  createPost: {
    query: createPost,
    optimisticUpdate: ({ allPosts }, variables) => ({
      allPosts: [{ ...variables, id: "tempID" }, ...allPosts]
    }),
    update: ({ allPosts }, { createPost: post }) => ({
      allPosts: allPosts.map(p => (p.id === "tempID" ? post : p))
    })
  },
  updatePost: {
    query: updatePost,
    optimisticUpdate: ({ allPosts }, variables) => ({
      allPosts: allPosts.map(p => (p.id === variables.id ? variables : p))
    }),
    update: ({ allPosts }, { updatePost: post }) => ({
      allPosts: allPosts.map(p => (p.id === post.id ? post : p))
    })
  },
  deletePost: {
    query: deletePost,
    optimisticUpdate: ({ allPosts }, { id }) => ({
      allPosts: allPosts.filter(_ => _.id !== id)
    }),
    update: ({ allPosts }, { deletePost: { id } }) => ({
      allPosts: allPosts.filter(_ => _.id !== id)
    })
  }
};

export default function PostsContainer() {
  return (
    <Consumer query={allPosts} variables={{ orderBy: "createdAt_DESC" }} mutations={mutations}>
      {props => <Posts {...props} />}
    </Consumer>
  );
}
