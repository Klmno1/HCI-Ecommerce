import { PostgresExperimentStore } from "@/lib/experiment/postgres-store";

const experimentStore = new PostgresExperimentStore();

export function getExperimentStore() {
  return experimentStore;
}
