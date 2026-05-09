"use client";

import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="glass w-full max-w-md rounded-3xl p-8 text-center">
        <h1 className="text-4xl font-black">出错了</h1>
        <p className="mt-4 text-slate-400">{error.message || "Something went wrong"}</p>
        <div className="mt-8 flex justify-center gap-4">
          <button onClick={reset} className="rounded-full bg-brand-600 px-6 py-3 font-semibold hover:bg-brand-500">
            重试
          </button>
          <Link href="/" className="rounded-full border border-white/15 px-6 py-3 font-semibold hover:bg-white/10">
            返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
