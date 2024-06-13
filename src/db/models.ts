import { ObjectId } from "npm:mongodb";

export type User = {
  _id: ObjectId;
  email: string;
  name: string;
  google_id: string;
  picture: string;
};

export type Document<TContent = { [key: string]: unknown }> = {
  _id: ObjectId;
  user: ObjectId;
  extension: string;
  content: TContent;
  createdAt: Date;
  updatedAt: Date;
};
