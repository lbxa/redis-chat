import { PgSimplifyInflectionPreset } from "@graphile/simplify-inflection";
import { constant, lambda } from "grafast";
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
        add(a: Int!, b: Int!): Int!
      } 
    `,

    plans: {
      Query: {
        add(_, fieldArgs) {
          const $a = fieldArgs.getRaw("a");
          const $b = fieldArgs.getRaw("b");
          return lambda([$a, $b], (values) => values[0] + values[1]);
        },
        meaningOfLife() {
          return constant(42);
        }
      },
    }
  }
})