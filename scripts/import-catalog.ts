import { loadEnvConfig } from "@next/env";
import { buildCatalogArtifact, generatedCatalogPath, writeCatalogArtifact } from "@/lib/catalog-artifact";

async function main() {
  loadEnvConfig(process.cwd());

  const artifact = await buildCatalogArtifact();
  await writeCatalogArtifact(artifact);

  console.log(`Generated ${artifact.products.length} products to ${generatedCatalogPath}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
