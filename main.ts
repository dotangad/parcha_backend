import "https://deno.land/std@0.224.0/dotenv/load.ts";
import app from "./src/app.ts";

app.listen("localhost:8000");
console.log("Listening on port 8000");