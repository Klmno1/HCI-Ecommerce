import { randomUUID } from "crypto";
import { ensureDatabaseSchema } from "@/lib/db/schema";
import { getPostgresPool } from "@/lib/db/postgres";
import type {
  AppendExperimentEventInput,
  CreateExperimentSessionInput,
  ExperimentEvent,
  ExperimentSession,
  FinishExperimentSessionInput
} from "@/lib/experiment/types";
import type { ExperimentStore } from "@/lib/experiment/store";
import type { CartItem } from "@/lib/types";

type SessionRow = {
  id: string;
  email: string;
  task_id: string;
  status: ExperimentSession["status"];
  started_at: string | null;
  ended_at: string | null;
  duration_ms: number | null;
  click_count: number;
  cart_final: CartItem[] | null;
  created_at: string;
  updated_at: string;
};

type EventRow = {
  id: string;
  session_id: string;
  action: ExperimentEvent["action"];
  timestamp: string;
  relative_ms: number;
  page: string;
  target: string | null;
  label: string | null;
  value: Record<string, unknown> | null;
};

function mapSessionRow(row: SessionRow, events: ExperimentEvent[]): ExperimentSession {
  return {
    id: row.id,
    email: row.email,
    taskId: row.task_id,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationMs: row.duration_ms,
    clickCount: row.click_count,
    cartFinal: row.cart_final ?? [],
    events,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapEventRow(row: EventRow): ExperimentEvent {
  return {
    id: row.id,
    sessionId: row.session_id,
    action: row.action,
    timestamp: row.timestamp,
    relativeMs: row.relative_ms,
    page: row.page,
    target: row.target ?? undefined,
    label: row.label ?? undefined,
    value: row.value ?? undefined
  };
}

export class PostgresExperimentStore implements ExperimentStore {
  async createSession(input: CreateExperimentSessionInput) {
    await ensureDatabaseSchema();
    const pool = getPostgresPool();
    const sessionId = randomUUID();
    const result = await pool.query<SessionRow>(
      `
        INSERT INTO experiment_sessions (id, email, task_id, status)
        VALUES ($1, $2, $3, 'ready')
        RETURNING *
      `,
      [sessionId, input.email, input.taskId]
    );

    return mapSessionRow(result.rows[0], []);
  }

  async startSession(sessionId: string, startedAt: string) {
    await ensureDatabaseSchema();
    const pool = getPostgresPool();
    const result = await pool.query<SessionRow>(
      `
        UPDATE experiment_sessions
        SET
          status = 'started',
          started_at = COALESCE(started_at, $2),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [sessionId, startedAt]
    );

    if (!result.rows[0]) {
      throw new Error(`Experiment session not found: ${sessionId}`);
    }

    return mapSessionRow(result.rows[0], await this.getSessionEvents(sessionId));
  }

  async appendEvent(input: AppendExperimentEventInput) {
    await ensureDatabaseSchema();
    const pool = getPostgresPool();
    const eventId = randomUUID();

    await pool.query(
      `
        INSERT INTO experiment_events (
          id, session_id, action, timestamp, relative_ms, page, target, label, value
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
      `,
      [
        eventId,
        input.sessionId,
        input.action,
        input.timestamp,
        input.relativeMs,
        input.page,
        input.target ?? null,
        input.label ?? null,
        JSON.stringify(input.value ?? null)
      ]
    );

    const sessionResult = await pool.query<SessionRow>(
      `
        UPDATE experiment_sessions
        SET
          click_count = click_count + 1,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [input.sessionId]
    );

    if (!sessionResult.rows[0]) {
      throw new Error(`Experiment session not found: ${input.sessionId}`);
    }

    return mapSessionRow(sessionResult.rows[0], await this.getSessionEvents(input.sessionId));
  }

  async finishSession(input: FinishExperimentSessionInput) {
    await ensureDatabaseSchema();
    const pool = getPostgresPool();
    const result = await pool.query<SessionRow>(
      `
        UPDATE experiment_sessions
        SET
          status = 'completed',
          ended_at = $2,
          duration_ms = $3,
          cart_final = $4::jsonb,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [input.sessionId, input.endedAt, input.durationMs, JSON.stringify(input.cartFinal)]
    );

    if (!result.rows[0]) {
      throw new Error(`Experiment session not found: ${input.sessionId}`);
    }

    return mapSessionRow(result.rows[0], await this.getSessionEvents(input.sessionId));
  }

  async getSession(sessionId: string) {
    await ensureDatabaseSchema();
    const pool = getPostgresPool();
    const result = await pool.query<SessionRow>(`SELECT * FROM experiment_sessions WHERE id = $1`, [sessionId]);

    if (!result.rows[0]) {
      return null;
    }

    return mapSessionRow(result.rows[0], await this.getSessionEvents(sessionId));
  }

  private async getSessionEvents(sessionId: string) {
    const pool = getPostgresPool();
    const result = await pool.query<EventRow>(
      `
        SELECT id, session_id, action, timestamp, relative_ms, page, target, label, value
        FROM experiment_events
        WHERE session_id = $1
        ORDER BY timestamp ASC, id ASC
      `,
      [sessionId]
    );

    return result.rows.map(mapEventRow);
  }
}
