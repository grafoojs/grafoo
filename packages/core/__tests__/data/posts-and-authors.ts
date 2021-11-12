export let data = {
  authors: {
    __typename: "AuthorConnection",
    edges: [
      {
        __typename: "AuthorEdge",
        node: {
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
                  body: "Sit dignissimos ullam tenetur ex minus saepe quo repellendus.",
                  id: "UG9zdDo5YzZhYmQ1OC0wY2M1LTQzNDEtODdhMi1lZGUzNjQ2ODVlYmQ=",
                  title: "Quam et qui"
                }
              },
              {
                __typename: "PostEdge",
                node: {
                  __typename: "Post",
                  body: "Ducimus harum delectus consectetur.",
                  id: "UG9zdDoyYzk2OWNlNy0wMmFlLTQyYjEtYTk0ZC03ZDBhMzg4MDRjODU=",
                  title: "Quam odit"
                }
              }
            ]
          }
        }
      },
      {
        __typename: "AuthorEdge",
        node: {
          __typename: "Author",
          id: "QXV0aG9yOmExZDFjM2YwLTViZDUtNDUzZS1iNGY4LTlmNDE5NDU3ZTVhNg==",
          name: "Rebekah Gleason",
          posts: {
            __typename: "PostConnection",
            edges: [
              {
                __typename: "PostEdge",
                node: {
                  __typename: "Post",
                  body: "Qui natus repellat porro.",
                  id: "UG9zdDphMmJjZTVmOC0yZWI3LTQyM2QtOTk0Zi1kODAwMmJkMDUwOWY=",
                  title: "Numquam ducimus rerum"
                }
              },
              {
                __typename: "PostEdge",
                node: {
                  __typename: "Post",
                  body: "Amet eos dolores.",
                  id: "UG9zdDpiYmI5NjgyMS0wNmZhLTRlMTYtOWUxYi0zYzJhNmZiNzcxMGQ=",
                  title: "Possimus et ullam"
                }
              }
            ]
          }
        }
      }
    ]
  },
  posts: {
    __typename: "PostConnection",
    edges: [
      {
        __typename: "PostEdge",
        node: {
          __typename: "Post",
          author: {
            __typename: "Author",
            id: "QXV0aG9yOmExZDNhMmJjLWU1MDMtNDY0MC05MTc4LTIzY2JkMzZiNTQyYw==",
            name: "Murphy Abshire"
          },
          body: "Sit dignissimos ullam tenetur ex minus saepe quo repellendus.",
          id: "UG9zdDo5YzZhYmQ1OC0wY2M1LTQzNDEtODdhMi1lZGUzNjQ2ODVlYmQ=",
          title: "Quam et qui"
        }
      },
      {
        __typename: "PostEdge",
        node: {
          __typename: "Post",
          author: {
            __typename: "Author",
            id: "QXV0aG9yOmExZDNhMmJjLWU1MDMtNDY0MC05MTc4LTIzY2JkMzZiNTQyYw==",
            name: "Murphy Abshire"
          },
          body: "Ducimus harum delectus consectetur.",
          id: "UG9zdDoyYzk2OWNlNy0wMmFlLTQyYjEtYTk0ZC03ZDBhMzg4MDRjODU=",
          title: "Quam odit"
        }
      },
      {
        __typename: "PostEdge",
        node: {
          __typename: "Post",
          author: {
            __typename: "Author",
            id: "QXV0aG9yOmExZDFjM2YwLTViZDUtNDUzZS1iNGY4LTlmNDE5NDU3ZTVhNg==",
            name: "Rebekah Gleason"
          },
          body: "Qui natus repellat porro.",
          id: "UG9zdDphMmJjZTVmOC0yZWI3LTQyM2QtOTk0Zi1kODAwMmJkMDUwOWY=",
          title: "Numquam ducimus rerum"
        }
      },
      {
        __typename: "PostEdge",
        node: {
          __typename: "Post",
          author: {
            __typename: "Author",
            id: "QXV0aG9yOmExZDFjM2YwLTViZDUtNDUzZS1iNGY4LTlmNDE5NDU3ZTVhNg==",
            name: "Rebekah Gleason"
          },
          body: "Amet eos dolores.",
          id: "UG9zdDpiYmI5NjgyMS0wNmZhLTRlMTYtOWUxYi0zYzJhNmZiNzcxMGQ=",
          title: "Possimus et ullam"
        }
      }
    ]
  }
};

export let records = {
  "UG9zdDpiYmI5NjgyMS0wNmZhLTRlMTYtOWUxYi0zYzJhNmZiNzcxMGQ=": {
    __typename: "Post",
    body: "Amet eos dolores.",
    id: "UG9zdDpiYmI5NjgyMS0wNmZhLTRlMTYtOWUxYi0zYzJhNmZiNzcxMGQ=",
    title: "Possimus et ullam"
  },
  "QXV0aG9yOmExZDFjM2YwLTViZDUtNDUzZS1iNGY4LTlmNDE5NDU3ZTVhNg==": {
    __typename: "Author",
    id: "QXV0aG9yOmExZDFjM2YwLTViZDUtNDUzZS1iNGY4LTlmNDE5NDU3ZTVhNg==",
    name: "Rebekah Gleason"
  },
  "UG9zdDphMmJjZTVmOC0yZWI3LTQyM2QtOTk0Zi1kODAwMmJkMDUwOWY=": {
    __typename: "Post",
    body: "Qui natus repellat porro.",
    id: "UG9zdDphMmJjZTVmOC0yZWI3LTQyM2QtOTk0Zi1kODAwMmJkMDUwOWY=",
    title: "Numquam ducimus rerum"
  },
  "UG9zdDoyYzk2OWNlNy0wMmFlLTQyYjEtYTk0ZC03ZDBhMzg4MDRjODU=": {
    __typename: "Post",
    body: "Ducimus harum delectus consectetur.",
    id: "UG9zdDoyYzk2OWNlNy0wMmFlLTQyYjEtYTk0ZC03ZDBhMzg4MDRjODU=",
    title: "Quam odit"
  },
  "QXV0aG9yOmExZDNhMmJjLWU1MDMtNDY0MC05MTc4LTIzY2JkMzZiNTQyYw==": {
    __typename: "Author",
    id: "QXV0aG9yOmExZDNhMmJjLWU1MDMtNDY0MC05MTc4LTIzY2JkMzZiNTQyYw==",
    name: "Murphy Abshire"
  },
  "UG9zdDo5YzZhYmQ1OC0wY2M1LTQzNDEtODdhMi1lZGUzNjQ2ODVlYmQ=": {
    __typename: "Post",
    body: "Sit dignissimos ullam tenetur ex minus saepe quo repellendus.",
    id: "UG9zdDo5YzZhYmQ1OC0wY2M1LTQzNDEtODdhMi1lZGUzNjQ2ODVlYmQ=",
    title: "Quam et qui"
  }
};

export let path = {
  posts: {
    __typename: "PostConnection",
    edges: [
      {
        __typename: "PostEdge",
        node: {
          id: "UG9zdDo5YzZhYmQ1OC0wY2M1LTQzNDEtODdhMi1lZGUzNjQ2ODVlYmQ=",
          author: {
            id: "QXV0aG9yOmExZDNhMmJjLWU1MDMtNDY0MC05MTc4LTIzY2JkMzZiNTQyYw=="
          }
        }
      },
      {
        __typename: "PostEdge",
        node: {
          id: "UG9zdDoyYzk2OWNlNy0wMmFlLTQyYjEtYTk0ZC03ZDBhMzg4MDRjODU=",
          author: {
            id: "QXV0aG9yOmExZDNhMmJjLWU1MDMtNDY0MC05MTc4LTIzY2JkMzZiNTQyYw=="
          }
        }
      },
      {
        __typename: "PostEdge",
        node: {
          id: "UG9zdDphMmJjZTVmOC0yZWI3LTQyM2QtOTk0Zi1kODAwMmJkMDUwOWY=",
          author: {
            id: "QXV0aG9yOmExZDFjM2YwLTViZDUtNDUzZS1iNGY4LTlmNDE5NDU3ZTVhNg=="
          }
        }
      },
      {
        __typename: "PostEdge",
        node: {
          id: "UG9zdDpiYmI5NjgyMS0wNmZhLTRlMTYtOWUxYi0zYzJhNmZiNzcxMGQ=",
          author: {
            id: "QXV0aG9yOmExZDFjM2YwLTViZDUtNDUzZS1iNGY4LTlmNDE5NDU3ZTVhNg=="
          }
        }
      }
    ]
  },
  authors: {
    __typename: "AuthorConnection",
    edges: [
      {
        __typename: "AuthorEdge",
        node: {
          id: "QXV0aG9yOmExZDNhMmJjLWU1MDMtNDY0MC05MTc4LTIzY2JkMzZiNTQyYw==",
          posts: {
            __typename: "PostConnection",
            edges: [
              {
                __typename: "PostEdge",
                node: {
                  id: "UG9zdDo5YzZhYmQ1OC0wY2M1LTQzNDEtODdhMi1lZGUzNjQ2ODVlYmQ="
                }
              },
              {
                __typename: "PostEdge",
                node: {
                  id: "UG9zdDoyYzk2OWNlNy0wMmFlLTQyYjEtYTk0ZC03ZDBhMzg4MDRjODU="
                }
              }
            ]
          }
        }
      },
      {
        __typename: "AuthorEdge",
        node: {
          id: "QXV0aG9yOmExZDFjM2YwLTViZDUtNDUzZS1iNGY4LTlmNDE5NDU3ZTVhNg==",
          posts: {
            __typename: "PostConnection",
            edges: [
              {
                __typename: "PostEdge",
                node: {
                  id: "UG9zdDphMmJjZTVmOC0yZWI3LTQyM2QtOTk0Zi1kODAwMmJkMDUwOWY="
                }
              },
              {
                __typename: "PostEdge",
                node: {
                  id: "UG9zdDpiYmI5NjgyMS0wNmZhLTRlMTYtOWUxYi0zYzJhNmZiNzcxMGQ="
                }
              }
            ]
          }
        }
      }
    ]
  }
};
