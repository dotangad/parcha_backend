import { Application } from "https://deno.land/x/oak/mod.ts";
import { authrouter } from "./auth.ts";

const app = new Application();

// Logger
app.use(async (ctx, next) => {
  const start = performance.now();
  await next();
  const ms = performance.now() - start;
  console.log(
    `${ctx.request.method} ${ctx.request.url} - ${
      ctx.response.status
    } ${ms.toFixed(2)}ms`,
  );
});

app.use(authrouter.routes());
app.use(authrouter.allowedMethods());

export default app;
