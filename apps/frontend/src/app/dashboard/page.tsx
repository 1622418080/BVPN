"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, logout, money } from "../../lib/api";

type Dashboard = {
  subscription?: {
    status: string;
    endAt: string;
    trafficLimitGb: number;
    plan: { name: string };
  } | null;
  orders: Array<{
    id: string;
    status: string;
    amountCents: number;
    currency: string;
    createdAt: string;
    plan: { name: string };
  }>;
  accounts: Array<{
    id: string;
    assignedIp: string;
    publicKey: string;
    node: { name: string; region: string };
  }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [config, setConfig] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError("");
    try {
      const dashboard = await api<Dashboard>("/dashboard");
      setData(dashboard);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function provision() {
    setError("");
    try {
      await api("/vpn/provision", { method: "POST", body: "{}" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "开通失败 — 请确认已有有效订阅");
    }
  }

  async function downloadConfig() {
    setError("");
    try {
      const text = await api<string>("/vpn/config");
      setConfig(text);
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bvpn.conf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "下载失败 — 请先创建配置");
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center">
        <p className="text-slate-400">加载中...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-xl font-bold">BVPN Dashboard</Link>
        <div className="flex items-center gap-3">
          <Link href="/pricing" className="rounded-full border border-white/10 px-4 py-2 text-sm">购买套餐</Link>
          <button onClick={logout} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950">退出</button>
        </div>
      </div>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <div className="glass rounded-3xl p-6">
            <p className="text-sm text-slate-400">当前套餐</p>
            <h1 className="mt-2 text-3xl font-black">{data?.subscription?.plan.name || "未开通"}</h1>
            <p className="mt-3 text-slate-300">
              状态：{data?.subscription?.status || "无"}<br />
              到期：{data?.subscription ? new Date(data.subscription.endAt).toLocaleString() : "-"}<br />
              流量：{data?.subscription?.trafficLimitGb || 0} GB
            </p>
            <button onClick={provision} className="mt-6 w-full rounded-2xl bg-brand-600 p-3 font-semibold hover:bg-brand-500">
              创建/刷新 WireGuard 配置
            </button>
            <button onClick={downloadConfig} className="mt-3 w-full rounded-2xl border border-white/10 p-3 font-semibold hover:bg-white/10">
              下载 bvpn.conf
            </button>
            {error && <p className="mt-4 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
          </div>

          <div className="glass rounded-3xl p-6">
            <h2 className="text-xl font-bold">节点账户</h2>
            <div className="mt-4 space-y-3">
              {data?.accounts.map((account) => (
                <div key={account.id} className="rounded-2xl bg-white/5 p-4 text-sm">
                  <p className="font-semibold">{account.node.name} · {account.node.region}</p>
                  <p className="mt-1 text-slate-400">IP：{account.assignedIp}</p>
                  <p className="mt-1 truncate text-slate-500">PublicKey：{account.publicKey}</p>
                </div>
              ))}
              {!data?.accounts.length && <p className="text-sm text-slate-500">暂无节点账户。</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-3xl p-6">
            <h2 className="text-xl font-bold">最近订单</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              {data?.orders.map((order) => (
                <div key={order.id} className="grid grid-cols-4 gap-3 border-b border-white/10 p-4 text-sm last:border-0">
                  <span>{order.plan.name}</span>
                  <span>{money(order.amountCents, order.currency)}</span>
                  <span className={order.status === "PAID" ? "text-emerald-300" : "text-yellow-300"}>{order.status}</span>
                  <span className="text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
              {!data?.orders.length && <p className="p-4 text-sm text-slate-500">暂无订单。</p>}
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <h2 className="text-xl font-bold">WireGuard 配置预览</h2>
            <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-xs text-slate-300">
              {config || "点击"下载 bvpn.conf"后会在这里显示配置。"}
            </pre>
          </div>
        </div>
      </section>
    </main>
  );
}
