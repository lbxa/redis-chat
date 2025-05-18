import "graphile-config";
import "postgraphile";

import pg from "pg";
import { makePgService } from "postgraphile/adaptors/pg";
import { PostGraphileAmberPreset } from "postgraphile/presets/amber";
import { PostGraphileRelayPreset } from "postgraphile/presets/relay";

const pool = new pg.Pool({
  connectionString: "postgresql://o_server:ilovewinning@localhost:5432/o",
});

/** @type {import('graphile-config').Preset} */
const preset = {
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

export default preset;
