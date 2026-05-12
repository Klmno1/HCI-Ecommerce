import { Suspense } from "react";
import { CatalogShell } from "@/components/catalog/catalog-shell";
import { ExperimentGate } from "@/components/experiment/experiment-gate";

export default function HomePage() {
  return (
    <ExperimentGate>
      <Suspense fallback={null}>
        <CatalogShell />
      </Suspense>
    </ExperimentGate>
  );
}
