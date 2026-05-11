import { promises as fs } from "fs";
import path from "path";

async function main() {
  const sourceDirectory = path.join(process.cwd(), "images");
  const targetDirectory = path.join(process.cwd(), "public", "product-images");

  try {
    await fs.access(sourceDirectory);
  } catch {
    console.log("No images directory found. Skipping public image sync.");
    return;
  }

  await fs.mkdir(targetDirectory, { recursive: true });
  await fs.cp(sourceDirectory, targetDirectory, {
    recursive: true,
    force: true,
    errorOnExist: false
  });
  console.log(`Synced product images to ${targetDirectory}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
