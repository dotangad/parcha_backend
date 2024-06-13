import { Router } from "../deps.ts";
import db from "./db/index.ts";
import { Document } from "./db/models.ts";
import { ObjectId } from "npm:mongodb";
import { verifyAccessToken } from "./lib/middleware.ts";
import { EXTENSIONS } from "./ext/engine.ts";
import { TDocumentQuery } from "./lib/documents.ts";

export const docrouter = new Router({
  prefix: "/v1/documents",
});

docrouter.post(
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

    // Insert document
    let insertedId;
    const documentCollection = db.collection<Document>("documents");
    try {
      const { insertedId: iid } = await documentCollection.insertOne(
        {
          _id: new ObjectId(),
          extension: extensionId,
          user: user._id,
          content: content,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      );
      insertedId = iid;
    } catch (error) {
      console.error("Failed to insert document:", error);
      ctx.response.status = 500;
      ctx.response.body = JSON.stringify({
        success: false,
        error: "Failed to insert document",
      });
      return await next();
    }

    const document = await documentCollection.findOne<Document>({
      _id: insertedId!,
    });

    // Run onCreate hook
    try {
      extension.hooks.onCreate &&
        (await extension.hooks.onCreate(document!));
    } catch (error) {
      ctx.response.status = 500;
      ctx.response.body = JSON.stringify({
        success: false,
        error: "Extension onCreate hook failed. Check logs for error.",
      });
      console.log(error);
      return await next();
    }

    ctx.response.body = JSON.stringify({
      success: true,
      document,
    });
  },
);

docrouter.get("/:documentId", verifyAccessToken, async (ctx, next) => {
  const { documentId } = ctx.params;
  const user = ctx.state.user;
  const documentCollection = db.collection<Document>("documents");
  const document = await documentCollection.findOne({
    _id: new ObjectId(documentId),
    user: user._id,
  });

  if (!document) {
    ctx.response.status = 404;
    ctx.response.body = JSON.stringify({
      success: false,
      error: "Document not found",
    });
    return await next();
  }

  ctx.response.body = JSON.stringify({
    success: true,
    document,
  });
});

docrouter.post("/", verifyAccessToken, async (ctx, next) => {
  const { query, includeTitles } = (await ctx.request.body.json()) as {
    query: TDocumentQuery;
    includeTitles?: boolean;
  };
  const user = ctx.state.user;
  const documentCollection = db.collection<Document>("documents");

  const filter: Record<string, any> = { user: user._id };
  if (query.from) filter.createdAt = { $gte: query.from };
  if (query.to) filter.createdAt = { ...filter.createdAt, $lte: query.to };
  if (query.extensionId) filter.extensionId = { $in: query.extensionId };
  const options: Record<string, any> = {};
  if (query.orderBy) {
    options.sort = { [query.orderBy]: query.order === "desc" ? -1 : 1 };
  }
  options.limit = 50;
  if (query.limit) options.limit = query.limit;
  if (query.skip) options.skip = query.skip;

  const documents = await documentCollection.find(filter, options).toArray();
  ctx.response.body = JSON.stringify({
    success: true,
    // FIXME: There has to be a faster way to do this
    documents: includeTitles
      ? await Promise.all(documents.map(async (doc) => ({
        ...doc,
        title: await EXTENSIONS[doc.extension].helpers.getDocumentTitle(doc),
      })))
      : documents,
  });
});
