import { MongoClient } from "../../deps.ts";

const uri = "mongodb://friday:friday@localhost:27017";
const client = new MongoClient(uri);

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
  }
}

const db = client.db("friday");

export { client, connectDB };
export default db;
