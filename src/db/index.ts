import { pgClient } from "../../deps.ts";

const db = new pgClient({
  user: Deno.env.get("POSTGRES_USER"),
  password: Deno.env.get("POSTGRES_PASSWORD"),
  database: Deno.env.get("POSTGRES_DB"),
  hostname: Deno.env.get("POSTGRES_HOST"),
  port: Deno.env.get("POSTGRES_PORT"),
});
await db.connect();

export default db;
