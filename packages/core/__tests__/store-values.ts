import graphql from "@grafoo/core/tag";
import storeValues from "../src/store-values";

let tree = {
  authors: [
    {
      id: "a1d3a2bc-e503-4640-9178-23cbd36b542c",
      name: "Murphy Abshire",
      posts: [
        {
          body: "Sit dignissimos ullam tenetur ex minus saepe quo repellendus.",
          id: "9c6abd58-0cc5-4341-87a2-ede364685ebd",
          title: "Quam et qui"
        },
        {
          body: "Ducimus harum delectus consectetur.",
          id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85",
          title: "Quam odit"
        },
        {
          body: "Qui natus repellat porro.",
          id: "a2bce5f8-2eb7-423d-994f-d8002bd0509f",
          title: "Numquam ducimus rerum"
        },
        {
          body: "Amet eos dolores.",
          id: "bbb96821-06fa-4e16-9e1b-3c2a6fb7710d",
          title: "Possimus et ullam"
        }
      ]
    },
    {
      id: "a1d1c3f0-5bd5-453e-b4f8-9f419457e5a6",
      name: "Rebekah Gleason",
      posts: [
        {
          body: "Facilis voluptas mollitia est temporibus voluptatem quibusdam itaque soluta.",
          id: "9007748e-5e37-4f3a-8da2-b2041505a867",
          title: "Et praesentium"
        },
        {
          body: "Architecto et totam rerum esse omnis nihil eius autem.",
          id: "77c483dd-6529-4c72-9bb6-bbfd69f65682",
          title: "Sunt nemo"
        },
        {
          body: "Architecto fugiat odit quam est est maxime quos exercitationem.",
          id: "802e2565-3b33-4b89-9fbc-e0c8d1dbddae",
          title: "Aut aspernatur qui"
        },
        {
          body: "Vel voluptatibus quis esse non fuga debitis.",
          id: "90b11972-305f-43f8-a6a8-ddad70d1459b",
          title: "Iure rerum ratione"
        }
      ]
    }
  ],
  posts: [
    {
      author: {
        id: "a1d3a2bc-e503-4640-9178-23cbd36b542c",
        name: "Murphy Abshire"
      },
      body: "Sit dignissimos ullam tenetur ex minus saepe quo repellendus.",
      id: "9c6abd58-0cc5-4341-87a2-ede364685ebd",
      title: "Quam et qui"
    },
    {
      author: {
        id: "a1d3a2bc-e503-4640-9178-23cbd36b542c",
        name: "Murphy Abshire"
      },
      body: "Ducimus harum delectus consectetur.",
      id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85",
      title: "Quam odit"
    },
    {
      author: {
        id: "a1d3a2bc-e503-4640-9178-23cbd36b542c",
        name: "Murphy Abshire"
      },
      body: "Qui natus repellat porro.",
      id: "a2bce5f8-2eb7-423d-994f-d8002bd0509f",
      title: "Numquam ducimus rerum"
    },
    {
      author: {
        id: "a1d3a2bc-e503-4640-9178-23cbd36b542c",
        name: "Murphy Abshire"
      },
      body: "Amet eos dolores.",
      id: "bbb96821-06fa-4e16-9e1b-3c2a6fb7710d",
      title: "Possimus et ullam"
    },
    {
      author: {
        id: "a1d1c3f0-5bd5-453e-b4f8-9f419457e5a6",
        name: "Rebekah Gleason"
      },
      body: "Facilis voluptas mollitia est temporibus voluptatem quibusdam itaque soluta.",
      id: "9007748e-5e37-4f3a-8da2-b2041505a867",
      title: "Et praesentium"
    },
    {
      author: {
        id: "a1d1c3f0-5bd5-453e-b4f8-9f419457e5a6",
        name: "Rebekah Gleason"
      },
      body: "Architecto et totam rerum esse omnis nihil eius autem.",
      id: "77c483dd-6529-4c72-9bb6-bbfd69f65682",
      title: "Sunt nemo"
    },
    {
      author: {
        id: "a1d1c3f0-5bd5-453e-b4f8-9f419457e5a6",
        name: "Rebekah Gleason"
      },
      body: "Architecto fugiat odit quam est est maxime quos exercitationem.",
      id: "802e2565-3b33-4b89-9fbc-e0c8d1dbddae",
      title: "Aut aspernatur qui"
    },
    {
      author: {
        id: "a1d1c3f0-5bd5-453e-b4f8-9f419457e5a6",
        name: "Rebekah Gleason"
      },
      body: "Vel voluptatibus quis esse non fuga debitis.",
      id: "90b11972-305f-43f8-a6a8-ddad70d1459b",
      title: "Iure rerum ratione"
    }
  ]
};

let POSTS_AND_AUTHORS = graphql`
  query {
    posts {
      title
      body
      author {
        name
      }
    }

    authors {
      name
      posts {
        title
        body
      }
    }
  }
`;

let idFields = ["id"];

test("test1", () => {
  storeValues(tree, idFields, POSTS_AND_AUTHORS);
});

let data = {
  posts: [
    {
      author: {
        name: "Murphy Abshire",
        posts: [
          {
            id: "9c6abd58-0cc5-4341-87a2-ede364685ebd",
            title: "Quam et qui"
          },
          { id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85", title: "Quam odit" },
          {
            id: "a2bce5f8-2eb7-423d-994f-d8002bd0509f",
            title: "Numquam ducimus rerum"
          },
          {
            id: "bbb96821-06fa-4e16-9e1b-3c2a6fb7710d",
            title: "Possimus et ullam"
          }
        ],
        id: "a1d3a2bc-e503-4640-9178-23cbd36b542c"
      },
      body: "Sit dignissimos ullam tenetur ex minus saepe quo repellendus.",
      title: "Quam et qui",
      id: "9c6abd58-0cc5-4341-87a2-ede364685ebd"
    },
    {
      author: {
        name: "Murphy Abshire",
        posts: [
          {
            id: "9c6abd58-0cc5-4341-87a2-ede364685ebd",
            title: "Quam et qui"
          },
          { id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85", title: "Quam odit" },
          {
            id: "a2bce5f8-2eb7-423d-994f-d8002bd0509f",
            title: "Numquam ducimus rerum"
          },
          {
            id: "bbb96821-06fa-4e16-9e1b-3c2a6fb7710d",
            title: "Possimus et ullam"
          }
        ],
        id: "a1d3a2bc-e503-4640-9178-23cbd36b542c"
      },
      body: "Ducimus harum delectus consectetur.",
      title: "Quam odit",
      id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85"
    },
    {
      author: {
        name: "Murphy Abshire",
        posts: [
          {
            id: "9c6abd58-0cc5-4341-87a2-ede364685ebd",
            title: "Quam et qui"
          },
          { id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85", title: "Quam odit" },
          {
            id: "a2bce5f8-2eb7-423d-994f-d8002bd0509f",
            title: "Numquam ducimus rerum"
          },
          {
            id: "bbb96821-06fa-4e16-9e1b-3c2a6fb7710d",
            title: "Possimus et ullam"
          }
        ],
        id: "a1d3a2bc-e503-4640-9178-23cbd36b542c"
      },
      body: "Qui natus repellat porro.",
      title: "Numquam ducimus rerum",
      id: "a2bce5f8-2eb7-423d-994f-d8002bd0509f"
    },
    {
      author: {
        name: "Murphy Abshire",
        posts: [
          {
            id: "9c6abd58-0cc5-4341-87a2-ede364685ebd",
            title: "Quam et qui"
          },
          { id: "2c969ce7-02ae-42b1-a94d-7d0a38804c85", title: "Quam odit" },
          {
            id: "a2bce5f8-2eb7-423d-994f-d8002bd0509f",
            title: "Numquam ducimus rerum"
          },
          {
            id: "bbb96821-06fa-4e16-9e1b-3c2a6fb7710d",
            title: "Possimus et ullam"
          }
        ],
        id: "a1d3a2bc-e503-4640-9178-23cbd36b542c"
      },
      body: "Amet eos dolores.",
      title: "Possimus et ullam",
      id: "bbb96821-06fa-4e16-9e1b-3c2a6fb7710d"
    },
    {
      author: {
        name: "Rebekah Gleason",
        posts: [
          {
            id: "9007748e-5e37-4f3a-8da2-b2041505a867",
            title: "Et praesentium"
          },
          { id: "77c483dd-6529-4c72-9bb6-bbfd69f65682", title: "Sunt nemo" },
          {
            id: "802e2565-3b33-4b89-9fbc-e0c8d1dbddae",
            title: "Aut aspernatur qui"
          },
          {
            id: "90b11972-305f-43f8-a6a8-ddad70d1459b",
            title: "Iure rerum ratione"
          }
        ],
        id: "a1d1c3f0-5bd5-453e-b4f8-9f419457e5a6"
      },
      body: "Facilis voluptas mollitia est temporibus voluptatem quibusdam itaque soluta.",
      title: "Et praesentium",
      id: "9007748e-5e37-4f3a-8da2-b2041505a867"
    },
    {
      author: {
        name: "Rebekah Gleason",
        posts: [
          {
            id: "9007748e-5e37-4f3a-8da2-b2041505a867",
            title: "Et praesentium"
          },
          { id: "77c483dd-6529-4c72-9bb6-bbfd69f65682", title: "Sunt nemo" },
          {
            id: "802e2565-3b33-4b89-9fbc-e0c8d1dbddae",
            title: "Aut aspernatur qui"
          },
          {
            id: "90b11972-305f-43f8-a6a8-ddad70d1459b",
            title: "Iure rerum ratione"
          }
        ],
        id: "a1d1c3f0-5bd5-453e-b4f8-9f419457e5a6"
      },
      body: "Architecto et totam rerum esse omnis nihil eius autem.",
      title: "Sunt nemo",
      id: "77c483dd-6529-4c72-9bb6-bbfd69f65682"
    },
    {
      author: {
        name: "Rebekah Gleason",
        posts: [
          {
            id: "9007748e-5e37-4f3a-8da2-b2041505a867",
            title: "Et praesentium"
          },
          { id: "77c483dd-6529-4c72-9bb6-bbfd69f65682", title: "Sunt nemo" },
          {
            id: "802e2565-3b33-4b89-9fbc-e0c8d1dbddae",
            title: "Aut aspernatur qui"
          },
          {
            id: "90b11972-305f-43f8-a6a8-ddad70d1459b",
            title: "Iure rerum ratione"
          }
        ],
        id: "a1d1c3f0-5bd5-453e-b4f8-9f419457e5a6"
      },
      body: "Architecto fugiat odit quam est est maxime quos exercitationem.",
      title: "Aut aspernatur qui",
      id: "802e2565-3b33-4b89-9fbc-e0c8d1dbddae"
    },
    {
      author: {
        name: "Rebekah Gleason",
        posts: [
          {
            id: "9007748e-5e37-4f3a-8da2-b2041505a867",
            title: "Et praesentium"
          },
          { id: "77c483dd-6529-4c72-9bb6-bbfd69f65682", title: "Sunt nemo" },
          {
            id: "802e2565-3b33-4b89-9fbc-e0c8d1dbddae",
            title: "Aut aspernatur qui"
          },
          {
            id: "90b11972-305f-43f8-a6a8-ddad70d1459b",
            title: "Iure rerum ratione"
          }
        ],
        id: "a1d1c3f0-5bd5-453e-b4f8-9f419457e5a6"
      },
      body: "Vel voluptatibus quis esse non fuga debitis.",
      title: "Iure rerum ratione",
      id: "90b11972-305f-43f8-a6a8-ddad70d1459b"
    }
  ]
};

let POSTS_WITH_FRAGMENTS = graphql`
  query {
    posts {
      ...P
    }
  }

  fragment P on Post {
    title
    body
    author {
      ...A
    }
  }

  fragment A on Author {
    name
    posts {
      title
    }
  }
`;

test("test2", () => {
  storeValues(data, idFields, POSTS_WITH_FRAGMENTS);
});
