import { Router } from "../deps.ts";
import db, { client } from "./db/index.ts";
import { User } from "./db/models.ts";
import { generateToken } from "./lib/auth.ts";
import { fetchGoogleUser } from "./lib/googleapis.ts";
import { verifyAccessToken } from "./lib/middleware.ts";

export const authrouter = new Router({
  prefix: "/v1/auth",
});

authrouter.get("/", async (ctx) => {
  try {
    await client.db().admin().ping(); // Perform a simple operation to check the connection
    ctx.response.body = "Database is connected!";
  } catch (error) {
    console.error(error);
    ctx.response.body = "Database not connected. Check console for error.";
  }
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
  const userCollection = db.collection<User>("users");
  const { upsertedId } = await userCollection.updateOne({ email: ud.email }, { $set: { email: ud.email, name: ud.name, google_id: ud.sub, picture: ud.picture } }, { upsert: true });
  const user = await userCollection.findOne<User>({ _id: upsertedId! });
  console.log(user);

  ctx.response.status = 200;
  ctx.response.headers.set("Content-Type", "application/json");
  ctx.response.body = JSON.stringify({
    success: true,
    user,
    token: await generateToken(user!),
  });
  next();
});

authrouter.post("/me/", verifyAccessToken, (ctx, next) => {
  ctx.response.status = 200;
  ctx.response.body = { success: true, user: ctx.state.user };
  next();
});
