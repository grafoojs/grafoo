import casual from "casual";
import { Low, Memory } from "lowdb";

casual.seed(666);

let times = (t: number, fn: (i: number) => void) => Array.from(Array(t), fn);

type Author = {
  id: string;
  name: string;
  posts: string[];
};

type Post = {
  title: string;
  body?: string;
  id: string;
  author: string;
};

type Db = {
  posts: Post[];
  authors: Author[];
};

export default function setupDB() {
  let db = new Low<Db>(new Memory());

  db.data = { posts: [], authors: [] };

  times(2, () =>
    db.data.authors.push({
      id: casual.uuid,
      name: casual.first_name + " " + casual.last_name,
      posts: []
    })
  );

  db.data.authors.forEach(({ id }) => {
    times(2, () =>
      db.data.posts.push({
        author: id,
        id: casual.uuid,
        title: casual.title,
        body: casual.short_description
      })
    );

    let posts = db.data.posts.filter((post) => post.author === id).map((post) => post.id);

    db.data.authors.find((author) => author.id === id).posts = posts;
  });

  db.write();

  return db;
}
