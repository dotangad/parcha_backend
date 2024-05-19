import { Router } from "https://deno.land/x/oak@v16.0.0/router.ts";
import db from "./db.ts";

export const authrouter = new Router({
  prefix: "/auth",
});

authrouter.get("/", (ctx) => {
  ctx.response.body = `Database is connected? ${db.connected}`;
});

authrouter.post("/google/", async (ctx, next) => {
  const { access_token } = await ctx.request.body.json();

  ctx.response.status = 200;
  next();
  // TOOD
  // -> call google api to get user data (with access token)
  // -> create user if not exists
  // -> send refresh token
});
