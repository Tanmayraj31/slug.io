import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { load } from "js-yaml";
import { Router } from "express";
import swaggerUi from "swagger-ui-express";

const specPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../../openapi.yaml");

const spec = load(readFileSync(specPath, "utf8"), { filename: specPath }) as Record<
  string,
  unknown
>;

const docsRouter = Router();

docsRouter.use(swaggerUi.serve);

docsRouter.get(
  "/",
  swaggerUi.setup(null, {
    swaggerUrl: "/api-docs/swagger.json",
    customSiteTitle: "URL Shortener API Docs",
  })
);

docsRouter.get("/swagger.json", (_request, response) => {
  response.json(spec);
});

export default docsRouter;
