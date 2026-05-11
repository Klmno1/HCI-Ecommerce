"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type {
  ExperimentEventAction,
  ExperimentSession,
  ExperimentSessionStatus
} from "@/lib/experiment/types";
import type { CartItem } from "@/lib/types";

type ParticipantState = {
  sessionId: string;
  email: string;
  taskId: string;
  status: ExperimentSessionStatus;
  startedAt: string | null;
};

type LogEventInput = {
  action: ExperimentEventAction;
  target?: string;
  label?: string;
  value?: Record<string, unknown>;
  page?: string;
};

type ExperimentContextValue = {
  participant: ParticipantState | null;
  isSubmitting: boolean;
  registerParticipant: (email: string, taskId: string) => Promise<void>;
  startTask: () => Promise<void>;
  logEvent: (input: LogEventInput) => void;
  finishTask: (cartFinal: CartItem[]) => Promise<void>;
  resetParticipant: () => void;
};

const ExperimentContext = createContext<ExperimentContextValue | null>(null);
const storageKey = "youde-experiment-session";
const cartStorageKey = "youde-cart";

function mapSessionToParticipant(session: ExperimentSession): ParticipantState {
  return {
    sessionId: session.id,
    email: session.email,
    taskId: session.taskId,
    status: session.status,
    startedAt: session.startedAt
  };
}

function getRelativeMs(startedAt: string | null) {
  if (!startedAt) {
    return 0;
  }
  return Math.max(0, Date.now() - new Date(startedAt).getTime());
}

function dispatchExperimentPayload(path: string, payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(path, blob);
    return;
  }

  void fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true
  }).catch((error) => {
    console.error(`Failed to send experiment payload to ${path}`, error);
  });
}

function resetClientState() {
  window.localStorage.removeItem(storageKey);
  window.localStorage.removeItem(cartStorageKey);
  window.location.replace("/");
}

export function ExperimentProvider({ children }: { children: React.ReactNode }) {
  const [participant, setParticipant] = useState<ParticipantState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const resetSessionState = () => {
      window.localStorage.removeItem(storageKey);
      setParticipant(null);
    };

    resetSessionState();
    window.addEventListener("pageshow", resetSessionState);

    return () => {
      window.removeEventListener("pageshow", resetSessionState);
    };
  }, []);

  useEffect(() => {
    if (!participant) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(participant));
  }, [participant]);

  const registerParticipant = async (email: string, taskId: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/experiment/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, taskId })
      });

      if (!response.ok) {
        throw new Error("Failed to create experiment session.");
      }

      const payload = (await response.json()) as { session: ExperimentSession };
      setParticipant(mapSessionToParticipant(payload.session));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startTask = async () => {
    if (!participant || participant.status !== "ready") {
      return;
    }

    setIsSubmitting(true);
    const startedAt = new Date().toISOString();

    try {
      const response = await fetch("/api/experiment/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: participant.sessionId,
          startedAt
        })
      });

      if (!response.ok) {
        throw new Error("Failed to start experiment session.");
      }

      const payload = (await response.json()) as { session: ExperimentSession };
      const nextParticipant = mapSessionToParticipant(payload.session);
      setParticipant(nextParticipant);

      dispatchExperimentPayload("/api/experiment/event", {
        sessionId: nextParticipant.sessionId,
        action: "task_start",
        timestamp: startedAt,
        relativeMs: 0,
        page: window.location.pathname,
        label: "開始任務"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const logEvent = (input: LogEventInput) => {
    if (!participant || participant.status !== "started") {
      return;
    }

    dispatchExperimentPayload("/api/experiment/event", {
      sessionId: participant.sessionId,
      action: input.action,
      timestamp: new Date().toISOString(),
      relativeMs: getRelativeMs(participant.startedAt),
      page: input.page ?? `${window.location.pathname}${window.location.search}`,
      target: input.target,
      label: input.label,
      value: input.value
    });
  };

  const finishTask = async (cartFinal: CartItem[]) => {
    if (!participant || participant.status !== "started" || !participant.startedAt) {
      return;
    }

    setIsSubmitting(true);
    const endedAt = new Date().toISOString();
    const durationMs = getRelativeMs(participant.startedAt);

    try {
      dispatchExperimentPayload("/api/experiment/event", {
        sessionId: participant.sessionId,
        action: "checkout_click",
        timestamp: endedAt,
        relativeMs: durationMs,
        page: `${window.location.pathname}${window.location.search}`,
        label: "前往結帳",
        value: {
          cartSize: cartFinal.reduce((sum, item) => sum + item.quantity, 0),
          cartItemIds: cartFinal.map((item) => item.id)
        }
      });

      const response = await fetch("/api/experiment/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: participant.sessionId,
          endedAt,
          durationMs,
          cartFinal
        })
      });

      if (!response.ok) {
        throw new Error("Failed to finish experiment session.");
      }

      setParticipant(null);
      resetClientState();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetParticipant = () => {
    setParticipant(null);
  };

  const value = useMemo<ExperimentContextValue>(
    () => ({
      participant,
      isSubmitting,
      registerParticipant,
      startTask,
      logEvent,
      finishTask,
      resetParticipant
    }),
    [participant, isSubmitting]
  );

  return <ExperimentContext.Provider value={value}>{children}</ExperimentContext.Provider>;
}

export function useExperiment() {
  const context = useContext(ExperimentContext);
  if (!context) {
    throw new Error("useExperiment must be used inside ExperimentProvider");
  }
  return context;
}
