import { createJwt, getNumericDate, verifyJwt } from "../../deps.ts";
import { User } from "../db/models.ts";

const keyJson = JSON.parse(await Deno.readTextFile("./jwtkey.json"));
const key = await crypto.subtle.importKey(
  "jwk",
  keyJson,
  { name: "HMAC", hash: "SHA-512" },
  keyJson.ext,
  keyJson.key_ops,
);

export async function generateToken(user: User) {
  const now = getNumericDate(new Date());
  const jwt = await createJwt(
    {
      alg: "HS512",
      typ: "JWT",
      sub: user.email,
      exp: now + 7 * 24 * 60 * 60,
      iat: now,
    },
    { ...user },
    key,
  );

  return jwt;
}

export async function userFromToken(token: string) {
  const pd = await verifyJwt(token, key);

  return pd;
}
