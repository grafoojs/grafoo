import { h } from "preact";
import { GrafooConsumer } from "@grafoo/preact";
import { allPosts, createPost, deletePost, updatePost } from "../queries";
import Posts from "./Posts";

const mutations = {
  createPost: {
    query: createPost,
    optmisticUpdate({ allPosts }, variables) {
      return { allPosts: [{ ...variables, id: "tempID" }, ...allPosts] };
    },
    update({ mutate, allPosts }, variables) {
      return mutate(variables).then(({ createPost: post }) => ({
        allPosts: allPosts.map(p => (p.id === "tempID" ? post : p))
      }));
    }
  },
  updatePost: {
    query: updatePost,
    optmisticUpdate({ allPosts }, variables) {
      return { allPosts: allPosts.map(p => (p.id === variables.id ? variables : p)) };
    },
    update({ mutate, allPosts }, variables) {
      return mutate(variables).then(({ updatePost: post }) => ({
        allPosts: allPosts.map(p => (p.id === post.id ? post : p))
      }));
    }
  },
  deletePost: {
    query: deletePost,
    optmisticUpdate({ allPosts }, { id }) {
      return { allPosts: allPosts.filter(_ => _.id !== id) };
    },
    update({ mutate, allPosts }, variables) {
      return mutate(variables).then(({ deletePost: { id } }) => ({
        allPosts: allPosts.filter(_ => _.id !== id)
      }));
    }
  }
};

export default function PostsContainer() {
  return (
    <GrafooConsumer
      query={allPosts}
      variables={{ orderBy: "createdAt_DESC" }}
      skipCache={false}
      mutations={mutations}
      render={props => <Posts {...props} />}
    />
  );
}
