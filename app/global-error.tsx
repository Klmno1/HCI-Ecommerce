"use client";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">
            Client Error
          </p>
          <h1 className="mt-3 text-2xl font-bold">頁面載入時發生錯誤</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {error.message}
          </p>
          {error.digest ? (
            <p className="mt-2 text-xs text-slate-400">digest: {error.digest}</p>
          ) : null}
          <pre className="mt-6 overflow-auto rounded-xl bg-slate-100 p-4 text-xs leading-6 text-slate-700">
            {error.stack}
          </pre>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 rounded-lg bg-[#3965ff] px-4 py-2 text-sm font-semibold text-white"
          >
            重新載入
          </button>
        </div>
      </body>
    </html>
  );
}
