import { h } from "preact";
import { Consumer } from "@grafoo/preact";
import { allPosts, createPost, deletePost, updatePost } from "./queries";
import Posts from "./Posts";

const mutations = {
  createPost: {
    query: createPost,
    optimisticUpdate: ({ allPosts }, post) => ({
      allPosts: [{ ...post, id: "tempID" }, ...allPosts]
    }),
    update: ({ allPosts }, { createPost: post }) => ({
      allPosts: allPosts.map(p => (p.id === "tempID" ? post : p))
    })
  },
  updatePost: {
    query: updatePost,
    optimisticUpdate: ({ allPosts }, post) => ({
      allPosts: allPosts.map(p => (p.id === post.id ? post : p))
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

const PostsContainer = () => (
  <Consumer query={allPosts} variables={{ orderBy: "createdAt_DESC" }} mutations={mutations}>
    {props => <Posts {...props} />}
  </Consumer>
);

export default PostsContainer;
