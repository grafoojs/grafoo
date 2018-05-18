import { h } from "preact";
import { GrafooConsumer } from "@grafoo/preact";
import { allPosts, createPost, deletePost } from "../queries";
import PostForm from "./PostForm";
import { Button, H2, Item, List, Wrapper } from "./ui-kit";

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

const PostsContainer = () => (
  <GrafooConsumer
    query={allPosts}
    variables={{ orderBy: "createdAt_DESC" }}
    skipCache={false}
    mutations={mutations}
    render={({ allPosts, loaded, deletePost, createPost }) => (
      <div>
        <PostForm submit={createPost} />
        {loaded ? (
          <List>
            {allPosts.map(post => (
              <Item key={post.id}>
                <Wrapper>
                  <H2>{post.title}</H2>
                  <div dangerouslySetInnerHTML={{ __html: post.content }} />
                  <br />
                  <Button>update post</Button>{" "}
                  <Button onClick={() => deletePost({ id: post.id })}>remove post</Button>
                </Wrapper>
              </Item>
            ))}
          </List>
        ) : (
          <Wrapper>loading...</Wrapper>
        )}
      </div>
    )}
  />
);

export default PostsContainer;
