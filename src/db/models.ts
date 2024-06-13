import { ObjectId } from "npm:mongodb";

export type User = {
  _id: ObjectId;
  email: string;
  name: string;
  google_id: string;
  picture: string;
}
