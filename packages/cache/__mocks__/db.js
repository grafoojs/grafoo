import casual from "casual";
import low from "lowdb";
import Memory from "lowdb/adapters/Memory";

casual.seed(666);

const adapter = new Memory();
const db = low(adapter);

db.defaults({ posts: [], authors: [] }).write();

db.drop();

Array.from(Array(2), () => {
  db
    .get("authors")
    .push({
      id: casual.uuid,
      name: casual.first_name + " " + casual.last_name
    })
    .write();
});

db
  .get("authors")
  .value()
  .forEach(_ => {
    Array.from(Array(4), () =>
      db
        .get("posts")
        .push({
          author: _.id,
          id: casual.uuid,
          title: casual.title,
          body: casual.short_description
        })
        .write()
    );

    const posts = db
      .get("posts")
      .filter(post => post.author === _.id)
      .map(post => post.id)
      .value();

    db
      .get("authors")
      .find({ id: _.id })
      .set("posts", posts)
      .write();
  });

export default db;
