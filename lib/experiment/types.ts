import type { CartItem } from "@/lib/types";

export type ExperimentSessionStatus = "ready" | "started" | "completed";

export type ExperimentEventAction =
  | "task_start"
  | "search_submit"
  | "category_select"
  | "subcategory_select"
  | "sort_change"
  | "page_change"
  | "filter_change"
  | "filter_reset"
  | "product_open"
  | "cart_open"
  | "cart_close"
  | "add_to_cart"
  | "cart_increase"
  | "cart_decrease"
  | "cart_remove"
  | "checkout_click";

export type ExperimentEvent = {
  id: string;
  sessionId: string;
  action: ExperimentEventAction;
  timestamp: string;
  relativeMs: number;
  page: string;
  target?: string;
  label?: string;
  value?: Record<string, unknown>;
};

export type ExperimentSession = {
  id: string;
  email: string;
  taskId: string;
  status: ExperimentSessionStatus;
  startedAt: string | null;
  endedAt: string | null;
  durationMs: number | null;
  clickCount: number;
  cartFinal: CartItem[];
  events: ExperimentEvent[];
  createdAt: string;
  updatedAt: string;
};

export type CreateExperimentSessionInput = {
  email: string;
  taskId: string;
};

export type AppendExperimentEventInput = {
  sessionId: string;
  action: ExperimentEventAction;
  timestamp: string;
  relativeMs: number;
  page: string;
  target?: string;
  label?: string;
  value?: Record<string, unknown>;
};

export type FinishExperimentSessionInput = {
  sessionId: string;
  endedAt: string;
  durationMs: number;
  cartFinal: CartItem[];
};
