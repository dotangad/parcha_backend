import { Application, oakCors } from "../deps.ts";
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

// CORS
app.use(oakCors());

app.use(authrouter.routes());
app.use(authrouter.allowedMethods());

export default app;
