import { Router } from "../deps.ts";
import db from "./db/index.ts";
import { Document } from "./db/models.ts";
import { ObjectId } from "npm:mongodb";
import { verifyAccessToken } from "./lib/middleware.ts";
import { EXTENSIONS } from "./ext/engine.ts";

export const authrouter = new Router({
  prefix: "/v1/documents",
});

authrouter.post(
  "/create/:extensionId",
  verifyAccessToken,
  async (ctx, next) => {
    const { extensionId } = ctx.params;
    const { content } = await ctx.request.body.json();
    const user = ctx.state.user;

    // Check if extension exists
    if (!EXTENSIONS[extensionId]) {
      ctx.response.status = 400;
      ctx.response.body = JSON.stringify({
        success: false,
        error: "Extension not found",
      });
      return await next();
    }

    // Validate content body
    const extension = EXTENSIONS[extensionId];
    const contentSchema = extension.contentSchema;
    if (!contentSchema.safeParse(content).success) {
      ctx.response.status = 400;
      ctx.response.body = JSON.stringify({
        success: false,
        error: "Invalid content",
      });
      return await next();
    }

    const documentCollection = db.collection<Document>("documents");
    const { insertedId } = await documentCollection.insertOne(
      {
        _id: new ObjectId(),
        extension: extensionId,
        user: user._id,
        content: content,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    );

    const document = await documentCollection.findOne<Document>({
      _id: insertedId!,
    });

    try {
      await extension.hooks.onCreate(document!);
    } catch (error) {
      console.error(error);
    }

    ctx.response.body = JSON.stringify({
      success: true,
      document,
    });
  },
);
