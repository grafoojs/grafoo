import { h } from "preact";
import { Consumer } from "@grafoo/preact";
import { allPosts, createPost, deletePost, updatePost } from "../queries";
import Posts from "./Posts";

const mutations = {
  createPost: {
    query: createPost,
    optimisticUpdate: ({ allPosts }, variables) => ({
      allPosts: [{ ...variables, id: "tempID" }, ...allPosts]
    }),
    update: ({ mutate, allPosts }, variables) =>
      mutate(variables).then(({ createPost: post }) => ({
        allPosts: allPosts.map(p => (p.id === "tempID" ? post : p))
      }))
  },
  updatePost: {
    query: updatePost,
    optimisticUpdate: ({ allPosts }, variables) => ({
      allPosts: allPosts.map(p => (p.id === variables.id ? variables : p))
    }),
    update: ({ mutate, allPosts }, variables) =>
      mutate(variables).then(({ updatePost: post }) => ({
        allPosts: allPosts.map(p => (p.id === post.id ? post : p))
      }))
  },
  deletePost: {
    query: deletePost,
    optimisticUpdate: (props, { id }) => ({
      allPosts: props.allPosts.filter(_ => _.id !== id)
    }),
    update: ({ mutate, allPosts }, variables) =>
      mutate(variables).then(({ deletePost: { id } }) => ({
        allPosts: allPosts.filter(_ => _.id !== id)
      }))
  }
};

const PostsContainer = () => (
  <Consumer query={allPosts} variables={{ orderBy: "createdAt_DESC" }} mutations={mutations}>
    {props => <Posts {...props} />}
  </Consumer>
);

export default PostsContainer;
