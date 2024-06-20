import { express } from "../deps.ts";
import db from "./db/index.ts";
import { Document } from "./db/models.ts";
import { ObjectId } from "npm:mongodb";
import { verifyAccessToken } from "./lib/middleware.ts";
import { EXTENSIONS } from "./ext/engine.ts";
import { TDocumentQuery } from "./lib/documents.ts";

export const docrouter = express.Router();

docrouter.get("/", (_: express.Request, res: express.Response) => {
  res.json({
    success: true,
    message: "Hello, world!",
  });
});

docrouter.post(
  "/query",
  verifyAccessToken,
  async (req: express.Request, res: express.Response) => {
    const { query } = req.body as {
      query: TDocumentQuery;
    };
    const user = res.locals.user;
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

    let documents = await documentCollection.find(filter, options).toArray();
    if (query.includeTitles) {
      // FIXME: There has to be a faster way to do this
      documents = await Promise.all(documents.map(async (doc) => ({
        ...doc,
        title: await EXTENSIONS[doc.extension].helpers.getDocumentTitle(doc),
      })));
    }

    return res.status(200).json({
      success: true,
      documents,
    });
  },
);

docrouter.post(
  "/create/:extensionId",
  verifyAccessToken,
  async (req: express.Request, res: express.Response) => {
    const { extensionId } = req.params;
    const { content } = req.body;
    const user = res.locals.user;

    // Check if extension exists
    if (!EXTENSIONS[extensionId]) {
      return res.status(400).json({
        success: false,
        error: "Extension not found",
      });
    }

    // Validate content body
    const extension = EXTENSIONS[extensionId];
    const contentSchema = extension.contentSchema;
    const contentValidation = contentSchema.safeParse(content);
    console.log(content);
    if (!contentValidation.success) {
      return res.status(400).json({
        success: false,
        error: contentValidation.error.issues[0].message,
      });
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
      return res.status(500).json({
        success: false,
        error: "Failed to insert document",
      });
    }

    const document = await documentCollection.findOne<Document>({
      _id: insertedId!,
    });

    // Run onCreate hook
    try {
      extension.hooks.onCreate &&
        (await extension.hooks.onCreate(document!));
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        error: "Extension onCreate hook failed. Check logs for error.",
      });
    }

    return res.status(200).json({
      success: true,
      document,
    });
  },
);

docrouter.get(
  "/find/:documentId",
  verifyAccessToken,
  async (req: express.Request, res: express.Response) => {
    const { documentId } = req.params;
    const user = res.locals.user;
    const documentCollection = db.collection<Document>("documents");
    const document = await documentCollection.findOne({
      _id: ObjectId.createFromHexString(documentId),
      user: user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
      });
    }

    return res.status(200).json({
      success: true,
      document,
    });
  },
);

docrouter.post(
  "/update/:documentId",
  verifyAccessToken,
  async (req: express.Request, res: express.Response) => {
    const { documentId } = req.params;
    const { content } = req.body;
    const user = res.locals.user;
    const documentCollection = db.collection<Document>("documents");
    const result = await documentCollection.updateOne(
      { _id: ObjectId.createFromHexString(documentId), user: user._id },
      { $set: { content, updatedAt: new Date() } },
    );

    if (result.acknowledged && result.modifiedCount === 1) {
      return res.status(200).json({
        success: true,
        document: await documentCollection.findOne({
          _id: ObjectId.createFromHexString(documentId),
          user: user._id,
        }),
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to update document",
    });
  },
);
