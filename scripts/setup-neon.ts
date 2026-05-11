import { loadEnvConfig } from "@next/env";
import { ensureDatabaseSchema } from "@/lib/db/schema";

async function main() {
  loadEnvConfig(process.cwd());
  await ensureDatabaseSchema();
  console.log("Database schema is ready.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
