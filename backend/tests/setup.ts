import dotenv from "dotenv";
import { afterEach } from "vitest";

dotenv.config({ path: ".env.test", override: true });

const { clearDatabase } = await import("./helpers/db.js");

afterEach(async () => {
  await clearDatabase();
});