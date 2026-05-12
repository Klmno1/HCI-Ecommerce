"use client";

import { useEffect, useState } from "react";
import { useExperiment } from "@/components/providers/experiment-provider";

function isValidEmail(value: string) {
  return value.includes("@");
}

export function ExperimentGate({ children }: { children: React.ReactNode }) {
  const { participant, isSubmitting, registerParticipant, startTask, resetParticipant } = useExperiment();
  const [identifier, setIdentifier] = useState("");
  const [taskId, setTaskId] = useState("1");
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const shouldShowGate =
      !participant || participant.status === "ready" || participant.status === "completed";

    if (shouldShowGate && (window.location.pathname !== "/" || window.location.search)) {
      window.location.replace("/");
    }
  }, [participant]);

  const handleRegister = async () => {
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      setError("請輸入電子郵件。");
      return;
    }

    if (!isValidEmail(trimmedIdentifier)) {
      setError("請輸入包含 @ 的電子郵件。");
      return;
    }

    if (!taskId.trim()) {
      setError("請輸入任務編號。");
      return;
    }

    setError("");
    await registerParticipant(trimmedIdentifier, taskId.trim());
  };

  return (
    <>
      {children}

      {!participant ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.24)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3965ff]">EXPERIMENT</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">請先登入實驗</h1>
            <p className="mt-2 text-sm text-slate-500">
              請輸入電子郵件與任務編號，完成後即可開始操作。
            </p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">電子郵件</span>
                <input
                  type="email"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="tester@example.com"
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 outline-none transition focus:border-[#3965ff]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">任務編號</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={taskId}
                  onChange={(event) => setTaskId(event.target.value.replace(/[^0-9]/g, ""))}
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 outline-none transition focus:border-[#3965ff]"
                />
              </label>
            </div>

            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleRegister()}
              className="mt-6 w-full rounded-lg bg-[#3965ff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2147d1] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "登入中..." : "開始登入"}
            </button>
          </div>
        </div>
      ) : null}

      {participant?.status === "ready" ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-center shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3965ff]">READY</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">任務 {participant.taskId}</h2>
            <p className="mt-2 text-sm text-slate-500">{participant.email}</p>
            <p className="mt-4 text-sm text-slate-600">
              確認後請按下開始任務，系統才會開始計時與記錄操作。
            </p>
            <p className="mt-2 text-sm font-medium text-[#3965ff]">
              選取完目標商品後，請點開購物車，並點擊前往結帳，才算完成任務喔！
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={resetParticipant}
                className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                返回登入
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void startTask()}
                className="rounded-lg bg-[#3965ff] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2147d1] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "開始中..." : "開始任務"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {participant?.status === "completed" ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-[0_24px_60px_rgba(15,23,42,0.24)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3965ff]">COMPLETED</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">任務已完成</h2>
            <p className="mt-3 text-sm text-slate-600">
              系統已記錄本次操作。若要重新進行測試，請返回登入後再次開始。
            </p>
            <button
              type="button"
              onClick={resetParticipant}
              className="mt-6 rounded-lg bg-[#3965ff] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2147d1]"
            >
              返回登入
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
