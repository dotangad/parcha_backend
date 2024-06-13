import { z } from "../../deps.ts";
import { Document } from "../db/models.ts";

// deno-lint-ignore no-explicit-any
export const EXTENSIONS: Record<string, TExtension<any>> = {};

export type TExtension<TContent> = {
  name: string;
  version: string;
  identifier: string;
  description: string;
  contentSchema: z.AnyZodObject;
  hooks: {
    onRegister: () => Promise<void>;
    onCreate: (document: Document<TContent>) => Promise<Document<TContent>>;
  };
  helpers: {
    getDocumentTitle: (document: Document<TContent>) => string;
  };
};

export async function registerExtension<TContent>(
  extension: TExtension<TContent>,
) {
  await extension.hooks.onRegister();
  EXTENSIONS[extension.identifier] = extension;
}
