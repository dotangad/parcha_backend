import { Client } from "https://deno.land/x/postgres/mod.ts";

const db = new Client({
  user: Deno.env.get("POSTGRES_USER"),
  password: Deno.env.get("POSTGRES_PASSWORD"),
  database: Deno.env.get("POSTGRES_DB"),
  hostname: Deno.env.get("POSTGRES_HOST"),
  port: Deno.env.get("POSTGRES_PORT"),
});
await db.connect();

export default db;
