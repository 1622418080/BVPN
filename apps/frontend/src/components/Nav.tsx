"use client";

import Link from "next/link";
import { logout } from "../lib/api";

type Props = {
  dashboard?: boolean;
};

function decodeToken(): { role?: string } | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("bvpn_token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export function Nav({ dashboard }: Props) {
  const payload = decodeToken();
  const isAdmin = payload?.role === "ADMIN";

  if (dashboard) {
    return (
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">BVPN</Link>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="rounded-lg border border-white/10 px-3.5 py-1.5 text-sm text-white/60 transition-colors hover:border-white/20 hover:text-white">购买套餐</Link>
            {isAdmin && (
              <Link href="/admin" className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3.5 py-1.5 text-sm text-blue-300">管理</Link>
            )}
            <button onClick={logout} className="rounded-lg bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20">退出</button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">BVPN</Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/pricing" className="text-white/40 transition-colors hover:text-white/80">套餐</Link>
          <Link href="/login" className="text-white/40 transition-colors hover:text-white/80">登录</Link>
          <Link href="/register" className="rounded-lg bg-white px-4 py-1.5 font-medium text-black transition-all hover:bg-white/90">开始使用</Link>
        </nav>
      </div>
    </header>
  );
}
