import { Suspense } from "react";
import { CatalogShell } from "@/components/catalog/catalog-shell";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <CatalogShell />
    </Suspense>
  );
}
