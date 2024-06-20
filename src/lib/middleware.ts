import { express } from "../../deps.ts";
import { userFromToken } from "./auth.ts";

export async function verifyAccessToken(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const token = req.headers.authorization?.slice(7);
  console.log(token);
  if (!token) {
    res.status(401).json({ success: false, message: "Missing access token" });
    return;
  }

  try {
    const user = await userFromToken(token!);
    res.locals.user = user;
  } catch (e) {
    console.error(e);
    res.status(401).json({ success: false, message: "Invalid access token" });
    return;
  }

  next();
}
