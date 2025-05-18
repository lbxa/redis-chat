import { PgSimplifyInflectionPreset } from "@graphile/simplify-inflection";
import { constant } from "grafast";
import PostGraphileAmberPreset from "postgraphile/presets/amber";
import { PostGraphileRelayPreset } from "postgraphile/presets/relay";
import { gql, makeExtendSchemaPlugin } from "postgraphile/utils";

export const BASE_PLUGINS = [
  PostGraphileAmberPreset, 
  PostGraphileRelayPreset, 
  PgSimplifyInflectionPreset
] as const;

export const ChatPlugin = makeExtendSchemaPlugin(({sql, inflection}) => {
  return {
    typeDefs: gql`
      type ChatAlien {
        id: ID!
        name: String!
        age: Int!
        planet: String!
      }

      extend type Query {
        meaningOfLife: Int!
      } 
    `,

    plans: {
      Query: {
        meaningOfLife() {
          return constant(42);
        }
      },
    }
  }
})