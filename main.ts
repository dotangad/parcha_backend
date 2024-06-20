import "https://deno.land/std@0.224.0/dotenv/load.ts";
import app from "./src/app.ts";
import { connectDB } from "./src/db/index.ts";

await connectDB();
app.listen(8000);
console.log("Listening on port 8000");
