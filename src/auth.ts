import { express } from "../deps.ts";
import db, { client } from "./db/index.ts";
import { User } from "./db/models.ts";
import { generateToken } from "./lib/auth.ts";
import { fetchGoogleUser } from "./lib/googleapis.ts";
import { verifyAccessToken } from "./lib/middleware.ts";

export const authrouter = express.Router();

authrouter.get("/", async (req: express.Request, res: express.Response) => {
  try {
    await client.db().admin().ping(); // Perform a simple operation to check the connection
    res.status(200).json({ success: true, message: "Database is connected!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Database not connected. Check console for error.",
    });
  }
});

authrouter.post(
  "/google/",
  async (req: express.Request, res: express.Response) => {
    const { access_token } = req.body;
    console.log(req.body);
    const ud = await fetchGoogleUser(access_token);
    console.log(ud);

    if (!ud.email) {
      return res.status(400).json({
        success: false,
        message: "Invalid access token",
      });
    }

    // create user if not exists
    let user;
    try {
      const userCollection = db.collection<User>("users");
      await userCollection.updateOne({ email: ud.email }, {
        $set: {
          email: ud.email,
          name: ud.name,
          google_id: ud.sub,
          picture: ud.picture,
        },
      }, { upsert: true });
      user = await userCollection.findOne<User>({ email: ud.email });
      console.log(user);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Failed to create user",
      });
    }

    let token;
    try {
      token = await generateToken(user!);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Failed to generate token",
      });
    }

    return res.status(200).json({
      success: true,
      user,
      token,
    });
  },
);

authrouter.post(
  "/me/",
  verifyAccessToken,
  (_: express.Request, res: express.Response) => {
    res.status(200).json({ success: true, user: res.locals.user });
  },
);
