import { Router, verifyJwt } from "../deps.ts";
import db from "./db/index.ts";
import User, { UserInitializer, UserMutator } from "./db/models/public/User.ts";
import { generateToken, userFromToken } from "./lib/auth.ts";
import { fetchGoogleUser } from "./lib/googleapis.ts";
import { verifyAccessToken } from "./lib/middleware.ts";

export const authrouter = new Router({
  prefix: "/auth",
});

authrouter.get("/", (ctx) => {
  ctx.response.body = `Database is connected? ${db.connected}`;
});

authrouter.post("/google/", async (ctx, next) => {
  const { access_token } = await ctx.request.body.json();
  const ud = await fetchGoogleUser(access_token);

  if (!ud.email) {
    ctx.response.status = 400;
    ctx.response.headers.set("Content-Type", "application/json");
    ctx.response.body = JSON.stringify({
      success: false,
      message: "Invalid access token",
    });
    return;
  }

  // create user if not exists
  const {
    rows: [user],
  } = await db.queryObject<User>(
    `INSERT INTO "user" (id, email, name, google_id, picture)
      VALUES (GEN_RANDOM_UUID(), $1, $2, $3, $4)
      ON CONFLICT ON CONSTRAINT user_gid_email_key
      DO UPDATE SET
        picture = EXCLUDED.picture
      RETURNING *;`,
    [ud.email, ud.name, ud.sub, ud.picture],
  );

  ctx.response.headers.set("Content-Type", "application/json");
  ctx.response.body = JSON.stringify({
    success: true,
    user,
    refreshToken: await generateToken(user),
  });
  next();
});

authrouter.post("/me/", verifyAccessToken, async (ctx, next) => {
  ctx.response.status = 200;
  ctx.response.body = { success: true, user: ctx.state.user };
  next();
});
