import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel max-w-md rounded-2xl p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#3965ff]">404</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">找不到這個商品頁面</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          商品資料可能已下架，或是路徑輸入有誤。
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-[#3965ff] px-5 py-3 text-sm font-semibold text-white"
        >
          返回首頁
        </Link>
      </div>
    </main>
  );
}
