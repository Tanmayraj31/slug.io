// src/server.ts
import app from "./app.js";
import { env } from "./config/env.js";
const port = Number(process.env.PORT ?? 3000);

app.listen(env.port, () => {
  console.log(`API listening on port ${env.port}`);
});