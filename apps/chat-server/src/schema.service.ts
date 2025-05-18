import { Injectable, type OnModuleInit } from "@nestjs/common";
import { makePgService } from "postgraphile/adaptors/pg";
import { ChatPlugin, BASE_PLUGINS } from "./plugins";
import pg from "pg";
import { postgraphile } from "postgraphile";
import type { GraphQLSchema } from "grafast/graphql";

@Injectable()
export class SchemaService implements OnModuleInit {
  private pool!: pg.Pool;

  public preset!: GraphileConfig.Preset;
  public schema!: GraphQLSchema;
  public resolvedPreset!: GraphileConfig.ResolvedPreset;

  async onModuleInit() {
    this.pool = new pg.Pool({
      connectionString: "postgresql://o_server:ilovewinning@localhost:5432/o",
    });

    this.preset = {
      extends: [
        ...BASE_PLUGINS,
      ],
      plugins: [ChatPlugin],
      grafast: {
        explain: process.env.NODE_ENV === "development" ? true : false,
      },
      schema: {
        exportSchemaSDLPath: `${process.cwd()}/schema.graphql`,
      },
      pgServices: [
        makePgService({
          schemas: ["public", "user", "chat"],
          pool: this.pool,
        }),
      ],
    }

    const pgl = postgraphile(this.preset);
    const { schema, resolvedPreset } = await pgl.getSchemaResult();
    this.schema = schema;
    this.resolvedPreset = resolvedPreset;
  }
}