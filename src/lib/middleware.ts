import { Context } from "../../deps.ts";
import { userFromToken } from "./auth.ts";

export async function verifyAccessToken(
  ctx: Context,
  next: () => Promise<unknown>,
) {
  const token = ctx.request.headers.get("Authorization")?.substr(7);
  if (!token) {
    ctx.response.status = 401;
    ctx.response.headers.set("Content-Type", "application/json");
    ctx.response.body = { success: false, message: "Missing access token" };
    return;
  }

  try {
    const user = await userFromToken(token!);
    ctx.state.user = user;
  } catch (e) {
    console.error(e);
    ctx.response.status = 401;
    ctx.response.headers.set("Content-Type", "application/json");
    ctx.response.body = { success: false, message: "Invalid access token" };
    return;
  }

  next();
}
