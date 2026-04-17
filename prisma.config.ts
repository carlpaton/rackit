import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback to .env
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL ?? "",
  },
});
