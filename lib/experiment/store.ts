import type {
  AppendExperimentEventInput,
  CreateExperimentSessionInput,
  ExperimentSession,
  FinishExperimentSessionInput
} from "@/lib/experiment/types";

export interface ExperimentStore {
  createSession(input: CreateExperimentSessionInput): Promise<ExperimentSession>;
  startSession(sessionId: string, startedAt: string): Promise<ExperimentSession>;
  appendEvent(input: AppendExperimentEventInput): Promise<ExperimentSession>;
  finishSession(input: FinishExperimentSessionInput): Promise<ExperimentSession>;
  getSession(sessionId: string): Promise<ExperimentSession | null>;
}
