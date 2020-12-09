import casual from "casual";
import low from "lowdb";
import MemoryAdapter from "lowdb/adapters/Memory";

casual.seed(666);

const times = (t, fn) => Array.from(Array(t), fn);

export default function setupDB() {
  const db = low(new MemoryAdapter(""));

  db.defaults({ posts: [], authors: [] }).write();

  times(2, () =>
    db
      .get("authors")
      .push({
        id: casual.uuid,
        name: casual.first_name + " " + casual.last_name,
      })
      .write()
  );

  db.get("authors")
    .value()
    .forEach(({ id }) => {
      times(4, () =>
        db
          .get("posts")
          .push({
            author: id,
            id: casual.uuid,
            title: casual.title,
            body: casual.short_description,
          })
          .write()
      );

      const posts = db
        .get("posts")
        .filter((post) => post.author === id)
        .map((post) => post.id)
        .value();

      db.get("authors").find({ id }).set("posts", posts).write();
    });

  return db;
}
