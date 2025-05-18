import "graphile-config";
import "postgraphile";

import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { execute, hookArgs } from "grafast";
import type { DocumentNode, ExecutionResult } from "grafast/graphql";
import { validate } from "grafast/graphql";
import pg from "pg";
import { postgraphile } from "postgraphile";
import { makePgService } from "postgraphile/adaptors/pg";
import { PostGraphileAmberPreset } from "postgraphile/presets/amber";
import { gql } from "postgraphile/utils";

const pool = new pg.Pool({
  connectionString: "postgresql://o_server:ilovewinning@localhost:5432/o",
});

const preset: GraphileConfig.Preset = {
  extends: [PostGraphileAmberPreset],
  plugins: [],
  grafast: {
    explain: process.env.NODE_ENV === "development" ? true : false,
  },
  schema: {
    exportSchemaSDLPath: `${process.cwd()}/schema.graphql`,
  },
  pgServices: [
    makePgService({
      schemas: ["public", "user", "chat"],
      pool,
    }),
  ],
};

const pgl = postgraphile(preset);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function executeDocument<TData = any, TVariables = any>(
  requestContext: Partial<Grafast.RequestContext>,
  document: DocumentNode | TypedDocumentNode<TData, TVariables>,
  variableValues?: Record<string, unknown> | null,
  operationName?: string
): Promise<ExecutionResult<TData, TVariables>> {
  const { schema, resolvedPreset } = await pgl.getSchemaResult();

  // Validate the GraphQL document against the schema:
  const errors = validate(schema, document);
  if (errors.length > 0) {
    return { errors };
  }

  // Prepare the execution arguments:
  const args = await hookArgs({
    schema,
    document,
    variableValues,
    operationName,
    resolvedPreset,
    requestContext,
  });

  // Execute the request using Grafast:
  const result = await execute(args);

  // Cast the result to the types implied by the TypedDocumentNode:
  return result as ExecutionResult<TData, TVariables>;
}

const results = await executeDocument(
  {},
  gql`
    query {
      allChatChats {
        edges {
          node {
            id
            chatMembersByChatId {
              edges {
                node {
                  userUserByUserId {
                    firstName
                    lastName
                  }
                }
              }
            }
          }
        }
      }
    } 
  `,
  {},
);

console.log(results.data.allChatChats.edges.map(edge => edge.node.chatMembersByChatId.edges.map(member => member.node.userUserByUserId)));
