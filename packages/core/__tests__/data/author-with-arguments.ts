export let data = {
  author: {
    __typename: "Author",
    id: "QXV0aG9yOmExZDNhMmJjLWU1MDMtNDY0MC05MTc4LTIzY2JkMzZiNTQyYw==",
    name: "Murphy Abshire",
    posts: {
      __typename: "PostConnection",
      edges: [
        {
          __typename: "PostEdge",
          node: {
            __typename: "Post",
            id: "UG9zdDo5YzZhYmQ1OC0wY2M1LTQzNDEtODdhMi1lZGUzNjQ2ODVlYmQ=",
            title: "Quam et qui"
          }
        }
      ]
    }
  }
};

export let records = {
  "QXV0aG9yOmExZDNhMmJjLWU1MDMtNDY0MC05MTc4LTIzY2JkMzZiNTQyYw==": {
    __typename: "Author",
    id: "QXV0aG9yOmExZDNhMmJjLWU1MDMtNDY0MC05MTc4LTIzY2JkMzZiNTQyYw==",
    name: "Murphy Abshire"
  },
  "UG9zdDo5YzZhYmQ1OC0wY2M1LTQzNDEtODdhMi1lZGUzNjQ2ODVlYmQ=": {
    __typename: "Post",
    id: "UG9zdDo5YzZhYmQ1OC0wY2M1LTQzNDEtODdhMi1lZGUzNjQ2ODVlYmQ=",
    title: "Quam et qui"
  }
};

export let path = {
  "author:id:QXV0aG9yOmExZDNhMmJjLWU1MDMtNDY0MC05MTc4LTIzY2JkMzZiNTQyYw==": {
    id: "QXV0aG9yOmExZDNhMmJjLWU1MDMtNDY0MC05MTc4LTIzY2JkMzZiNTQyYw==",
    "posts:first:1": {
      __typename: "PostConnection",
      edges: [
        {
          __typename: "PostEdge",
          node: {
            id: "UG9zdDo5YzZhYmQ1OC0wY2M1LTQzNDEtODdhMi1lZGUzNjQ2ODVlYmQ="
          }
        }
      ]
    }
  }
};
