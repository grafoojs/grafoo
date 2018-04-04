import fs from "fs";
import path from "path";
import casual from "casual";
import { graphql } from "graphql";
import { makeExecutableSchema, addMockFunctionsToSchema } from "graphql-tools";

casual.seed(123);

const schemaString = fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf-8");

const schema = makeExecutableSchema({ typeDefs: schemaString });

const mocks = {
  ID: () => casual.uuid,
  Author: () => ({
    name: casual.name
  }),
  Post: () => ({
    title: casual.title,
    body: casual.text
  })
};

addMockFunctionsToSchema({ schema, mocks });

export default function executeQuery({ query, variables }) {
  return graphql({ schema, variableValues: variables, source: query });
}
