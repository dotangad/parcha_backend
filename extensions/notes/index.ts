import { TExtension } from "../../src/ext/engine.ts";
import { Document } from "../../src/db/models.ts";
import { z } from "../../deps.ts";

export type TContent = {
  title: string;
  content: string;
};

export default {
  name: "notes",
  identifier: "notes",
  description: "A simple note taking extension",
  version: "1.0.0",
  author: "Parcha",
  contentSchema: z.object({
    title: z.string(),
    content: z.string(),
  }),
  hooks: {
    onRegister: async () => {},
    onCreate: async (document: Document<TContent>) => document,
  },
  helpers: {
    getDocumentTitle: async (document: Document<TContent>) =>
      document.content.title,
  },
} as TExtension<TContent>;
