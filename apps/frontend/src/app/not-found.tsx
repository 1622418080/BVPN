import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="glass w-full max-w-md rounded-3xl p-8 text-center">
        <h1 className="text-6xl font-black">404</h1>
        <p className="mt-4 text-slate-400">Page not found</p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-brand-600 px-6 py-3 font-semibold hover:bg-brand-500"
        >
          返回首页
        </Link>
      </div>
    </main>
  );
}
