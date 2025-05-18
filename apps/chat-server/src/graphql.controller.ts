import { Controller, Post, Get, Req, Res, Body, Query } from '@nestjs/common';
import type { Request, Response } from 'express';
import { SchemaService } from './schema.service';
import { execute, hookArgs } from 'grafast';
import type { DocumentNode } from 'grafast/graphql';
import { validate } from 'grafast/graphql';
import { parse } from 'graphql';
import { defaultHTMLParts, ruruHTML } from 'ruru/server';
import type { RuruHTMLParts, RuruServerConfig } from 'ruru/server';

@Controller('graphql')
export class GraphQLController {
  constructor(private readonly schemaService: SchemaService) {}

  @Post()
  async handleGraphQLPost(
    @Body() body: { query: string; variables?: Record<string, any>; operationName?: string },
    @Req() request: Request,
    @Res() response: Response,
  ) {
    return this.executeGraphQL(body.query, body.variables, body.operationName, request, response);
  }

  private async executeGraphQL(
    query: string,
    variables: Record<string, any> | null | undefined,
    operationName: string | undefined,
    request: Request,
    response: Response,
  ) {
    try {
      const schema = this.schemaService.schema;
      const resolvedPreset = this.schemaService.resolvedPreset;
      const document: DocumentNode = parse(query);
      
      // Validate the query against the schema
      const errors = validate(schema, document);
      if (errors.length > 0) {
        return response.status(400).json({ errors });
      }
      
      // Prepare the request context with relevant info from the HTTP request
      const requestContext: Record<string, any> = {
        request,
        response,
      };
      
      // Prepare execution arguments
      const args = await hookArgs({
        schema,
        document,
        variableValues: variables || {},
        operationName,
        resolvedPreset,
        requestContext,
      });
      
      // Execute the query using Grafast
      const result = await execute(args);
      
      // Return the result
      return response.json(result);
    } catch (error: unknown) {
      console.error('GraphQL execution error:', error);
      
      return response.status(500).json({
        errors: [
          {
            message: 'An error occurred while executing the GraphQL query',
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              exception: {
                message: error instanceof Error ? error.message : String(error),
              },
            },
          },
        ],
      });
    }
  }

  @Get()
  async graphqlPlayground() {
    const resolvedPreset = this.schemaService.resolvedPreset;
    const { htmlParts: htmlPartsFromConfig } = resolvedPreset.ruru ?? {};
    const htmlParts: RuruHTMLParts = {
      ...defaultHTMLParts,
      ...htmlPartsFromConfig,
    };
    const config: RuruServerConfig = {
      endpoint: "/graphql",
      debugTools: ["explain", "plan"],
    };
    return ruruHTML(config, htmlParts); 
  }
}
