"use client";

import { useCallback, useEffect, useState } from "react";
import { api, logout } from "../../lib/api";
import type {
  AdminStats,
  AdminUsersResponse,
  AdminOrdersResponse,
  AdminSubscriptionsResponse
} from "../../lib/types";
import Link from "next/link";

type Tab = "overview" | "users" | "orders" | "subscriptions";

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

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUsersResponse | null>(null);
  const [orders, setOrders] = useState<AdminOrdersResponse | null>(null);
  const [subs, setSubs] = useState<AdminSubscriptionsResponse | null>(null);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState("");

  const payload = decodeToken();
  const isAdmin = payload?.role === "ADMIN";

  const fetchTab = useCallback(async (t: Tab, p = 1) => {
    setError("");
    try {
      if (t === "overview") setStats(await api<AdminStats>("/admin/api/stats"));
      if (t === "users") setUsers(await api<AdminUsersResponse>(`/admin/api/users?limit=20&page=${p}`));
      if (t === "orders") setOrders(await api<AdminOrdersResponse>(`/admin/api/orders?limit=20&page=${p}`));
      if (t === "subscriptions") setSubs(await api<AdminSubscriptionsResponse>(`/admin/api/subscriptions?limit=20&page=${p}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    }
  }, []);

  useEffect(() => {
    fetchTab(tab, page);
    if (tab !== "overview") return;
    const id = setInterval(() => fetchTab("overview"), 15_000);
    return () => clearInterval(id);
  }, [tab, page, fetchTab]);

  function switchTab(t: Tab) {
    setTab(t);
    setPage(1);
  }

  async function markPaid(orderId: string) {
    setPayingId(orderId);
    setError("");
    try {
      await api(`/admin/api/orders/${orderId}/pay`, { method: "POST" });
      await fetchTab(tab, page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setPayingId("");
    }
  }

  if (!payload) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <div className="glass w-full max-w-md rounded-3xl p-8 text-center">
          <h1 className="text-2xl font-bold">请先登录</h1>
          <Link href="/login" className="mt-6 inline-block rounded-full bg-brand-600 px-6 py-3 font-semibold">去登录</Link>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <div className="glass w-full max-w-md rounded-3xl p-8 text-center">
          <h1 className="text-2xl font-bold">权限不足</h1>
          <p className="mt-2 text-sm text-slate-400">仅管理员可访问此页面。</p>
          <Link href="/dashboard" className="mt-6 inline-block rounded-full bg-brand-600 px-6 py-3 font-semibold">返回仪表盘</Link>
        </div>
      </main>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "概览" },
    { key: "users", label: "用户" },
    { key: "orders", label: "订单" },
    { key: "subscriptions", label: "订阅" }
  ];

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-xl font-bold">BVPN Admin</Link>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="rounded-full border border-white/10 px-4 py-2 text-sm">仪表盘</Link>
          <button onClick={logout} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950">退出</button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="mb-8 flex gap-2 border-b border-white/10">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.key ? "border-b-2 border-brand-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
        )}

        {tab === "overview" && stats && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="总用户" value={stats.totalUsers} />
            <StatCard title="活跃订阅" value={stats.activeSubscriptions} />
            <StatCard title="总订单" value={stats.totalOrders} />
            <StatCard title="已支付订单" value={stats.paidOrders} />
            <StatCard title="总收入" value={`$${(stats.totalRevenueCents / 100).toFixed(2)}`} />
          </div>
        )}

        {tab === "users" && users && (
          <TableCard
            total={users.total} page={users.page} totalPages={users.totalPages}
            onPrev={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => Math.min(users.totalPages, p + 1))}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-slate-400">
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">角色</th>
                  <th className="p-4 font-medium">状态</th>
                  <th className="p-4 font-medium">注册时间</th>
                </tr>
              </thead>
              <tbody>
                {users.users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 last:border-0">
                    <td className="p-4">{u.email}</td>
                    <td className="p-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${u.role === "ADMIN" ? "bg-brand-500/20 text-brand-200" : "bg-white/5 text-slate-400"}`}>{u.role}</span>
                    </td>
                    <td className="p-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${u.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/20 text-red-200"}`}>{u.status}</span>
                    </td>
                    <td className="p-4 text-slate-400">{new Date(u.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}

        {tab === "orders" && orders && (
          <TableCard
            total={orders.total} page={orders.page} totalPages={orders.totalPages}
            onPrev={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => Math.min(orders.totalPages, p + 1))}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-slate-400">
                  <th className="p-4 font-medium">用户</th>
                  <th className="p-4 font-medium">套餐</th>
                  <th className="p-4 font-medium">金额</th>
                  <th className="p-4 font-medium">状态</th>
                  <th className="p-4 font-medium">时间</th>
                  <th className="p-4 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.orders.map((o) => (
                  <tr key={o.id} className="border-b border-white/5 last:border-0">
                    <td className="p-4">{o.user.email}</td>
                    <td className="p-4">{o.plan.name}</td>
                    <td className="p-4">${(o.amountCents / 100).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        o.status === "PAID" ? "bg-emerald-500/20 text-emerald-200" :
                        o.status === "PENDING" ? "bg-yellow-500/20 text-yellow-200" : "bg-red-500/20 text-red-200"
                      }`}>{o.status}</span>
                    </td>
                    <td className="p-4 text-slate-400">{new Date(o.createdAt).toLocaleString()}</td>
                    <td className="p-4">
                      {o.status === "PENDING" && (
                        <button
                          onClick={() => markPaid(o.id)}
                          disabled={payingId === o.id}
                          className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-50"
                        >
                          {payingId === o.id ? "处理..." : "标记已支付"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}

        {tab === "subscriptions" && subs && (
          <TableCard
            total={subs.total} page={subs.page} totalPages={subs.totalPages}
            onPrev={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => Math.min(subs.totalPages, p + 1))}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-slate-400">
                  <th className="p-4 font-medium">用户</th>
                  <th className="p-4 font-medium">套餐</th>
                  <th className="p-4 font-medium">状态</th>
                  <th className="p-4 font-medium">开始</th>
                  <th className="p-4 font-medium">到期</th>
                  <th className="p-4 font-medium">流量</th>
                </tr>
              </thead>
              <tbody>
                {subs.subscriptions.map((s) => (
                  <tr key={s.id} className="border-b border-white/5 last:border-0">
                    <td className="p-4">{s.user.email}</td>
                    <td className="p-4">{s.plan.name}</td>
                    <td className="p-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${s.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/20 text-red-200"}`}>{s.status}</span>
                    </td>
                    <td className="p-4 text-slate-400">{new Date(s.startAt).toLocaleDateString()}</td>
                    <td className="p-4 text-slate-400">{new Date(s.endAt).toLocaleDateString()}</td>
                    <td className="p-4">{s.trafficLimitGb} GB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}

        {tab === "overview" && !stats && (
          <p className="text-center text-slate-400">加载中...</p>
        )}
      </section>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="glass rounded-3xl p-6">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function TableCard({
  total, page, totalPages, onPrev, onNext, children
}: {
  total: number; page: number; totalPages: number;
  onPrev: () => void; onNext: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="glass overflow-hidden rounded-3xl">
      {children}
      <div className="flex items-center justify-between border-t border-white/10 p-4 text-sm text-slate-500">
        <span>共 {total} 条</span>
        <div className="flex items-center gap-3">
          <span>第 {page}/{totalPages} 页</span>
          <div className="flex gap-2">
            <button onClick={onPrev} disabled={page <= 1} className="rounded-lg border border-white/10 px-3 py-1 hover:bg-white/10 disabled:opacity-30">上一页</button>
            <button onClick={onNext} disabled={page >= totalPages} className="rounded-lg border border-white/10 px-3 py-1 hover:bg-white/10 disabled:opacity-30">下一页</button>
          </div>
        </div>
      </div>
    </div>
  );
}
