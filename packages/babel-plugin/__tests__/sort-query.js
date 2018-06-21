import { parse, print as graphqlPrint } from "graphql";
import sortQuery from "../src/sort-query";

const gql = String.raw;

function print(query, sort = false) {
  return sort ? graphqlPrint(sortQuery(parse(query))) : graphqlPrint(parse(query));
}

describe("sort-query", () => {
  it("should sort fields, variable declarations and arguments", () => {
    const query = gql`
      query($f: ID, $e: ID, $d: ID, $c: ID, $b: ID, $a: ID) {
        f
        e
        d
        c
        b
        a(f: $f, e: $e, d: $d, c: $c, b: $b, a: $a) {
          f
          e
          d
          c
          b
          a(f: $f, e: $e, d: $d, c: $c, b: $b, a: $a) {
            f
            e
            d
            c
            b
          }
        }
      }
    `;

    const expected = gql`
      query($a: ID, $b: ID, $c: ID, $d: ID, $e: ID, $f: ID) {
        a(a: $a, b: $b, c: $c, d: $d, e: $e, f: $f) {
          a(a: $a, b: $b, c: $c, d: $d, e: $e, f: $f) {
            b
            c
            d
            e
            f
          }
          b
          c
          d
          e
          f
        }
        b
        c
        d
        e
        f
      }
    `;

    expect(print(query, true)).toBe(print(expected));
  });

  it("should sort fragments", () => {
    const query = gql`
      query {
        user {
          posts {
            ...PostInfo
          }
          ...UserInfo
        }
      }
      fragment UserInfo on User {
        id
        id
        name
        bio
      }
      fragment PostInfo on Post {
        title
        content
      }
    `;

    const expected = gql`
      fragment PostInfo on Post {
        content
        title
      }
      fragment UserInfo on User {
        bio
        id
        id
        name
      }
      query {
        user {
          ...UserInfo
          posts {
            ...PostInfo
          }
        }
      }
    `;

    expect(print(query, true)).toBe(print(expected));
  });

  it("should sort inline fragments", () => {
    const query = gql`
      query {
        user {
          posts {
            ... on Post {
              title
              content
            }
          }
          ... on User {
            id
            name
            bio
          }
        }
      }
    `;

    const expected = gql`
      {
        user {
          ... on User {
            bio
            id
            name
          }
          posts {
            ... on Post {
              content
              title
            }
          }
        }
      }
    `;

    expect(print(query, true)).toBe(print(expected));
  });

  it("should sort directives", () => {
    const query = gql`
      query($c: ID, $b: ID, $a: ID) {
        someField @c(c: $c) @a(a: $a) @b(c: $b)
      }
    `;

    const expected = gql`
      query($a: ID, $b: ID, $c: ID) {
        someField @a(a: $a) @b(c: $b) @c(c: $c)
      }
    `;

    expect(print(query, true)).toBe(print(expected));
  });
});
