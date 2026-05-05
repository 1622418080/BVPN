import Link from "next/link";

export function Nav() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
      <Link href="/" className="flex items-center gap-3 text-xl font-bold">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-600">B</span>
        BVPN
      </Link>
      <nav className="flex items-center gap-5 text-sm text-slate-300">
        <Link href="/pricing" className="hover:text-white">套餐</Link>
        <Link href="/login" className="hover:text-white">登录</Link>
        <Link href="/register" className="rounded-full bg-white px-4 py-2 font-medium text-slate-950">开始使用</Link>
      </nav>
    </header>
  );
}
