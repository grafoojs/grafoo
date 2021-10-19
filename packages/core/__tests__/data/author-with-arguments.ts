export let data = {
  author: {
    __typename: "Author",
    id: "a1d3a2bc-e503-4640-9178-23cbd36b542c",
    name: "Murphy Abshire",
    posts: [
      {
        __typename: "Post",
        id: "9c6abd58-0cc5-4341-87a2-ede364685ebd",
        title: "Quam et qui"
      },
      {
        __typename: "Post",
        id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85",
        title: "Quam odit"
      }
    ]
  }
};

export let path = {
  "author:id:a1d3a2bc-e503-4640-9178-23cbd36b542c": {
    id: "a1d3a2bc-e503-4640-9178-23cbd36b542c",
    "posts:from:0:to:2": [
      { id: "9c6abd58-0cc5-4341-87a2-ede364685ebd" },
      { id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85" }
    ]
  }
};

export let records = {
  "a1d3a2bc-e503-4640-9178-23cbd36b542c": {
    __typename: "Author",
    id: "a1d3a2bc-e503-4640-9178-23cbd36b542c",
    name: "Murphy Abshire"
  },
  "2c969ce7-02ae-42b1-a94d-7d0a38804c85": {
    __typename: "Post",
    id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85",
    title: "Quam odit"
  },
  "9c6abd58-0cc5-4341-87a2-ede364685ebd": {
    __typename: "Post",
    id: "9c6abd58-0cc5-4341-87a2-ede364685ebd",
    title: "Quam et qui"
  }
};
