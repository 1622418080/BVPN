"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, money } from "../../lib/api";
import type { Plan, PlansResponse } from "../../lib/types";
import { Nav } from "../../components/Nav";

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState("");
  const [loadingId, setLoadingId] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    api<PlansResponse>("/plans")
      .then((data) => setPlans(data.plans))
      .catch((e) => setError(e instanceof Error ? e.message : "加载套餐失败"))
      .finally(() => setLoadingPlans(false));
  }, []);

  async function buy(planId: string, channel: "stripe" | "crypto" | "dev") {
    setError("");
    setLoadingId(`${planId}-${channel}`);
    try {
      const order = await api<{ order: { id: string } }>("/orders", {
        method: "POST",
        body: JSON.stringify({ planId })
      });

      if (channel === "dev") {
        await api("/payments/dev/mark-paid", {
          method: "POST",
          body: JSON.stringify({ orderId: order.order.id })
        });
        window.location.href = "/dashboard?paid=dev";
        return;
      }

      const paymentPath = channel === "stripe"
        ? "/payments/stripe/checkout"
        : "/payments/crypto/create";
      const payment = await api<{ checkoutUrl: string }>(paymentPath, {
        method: "POST",
        body: JSON.stringify({ orderId: order.order.id })
      });
      window.location.href = payment.checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建订单失败。请确认已经登录，且支付密钥已配置。");
    } finally {
      setLoadingId("");
    }
  }

  return (
    <main className="min-h-screen">
      <Nav />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-5xl font-black">选择套餐</h1>
          <p className="mt-4 text-slate-300">MVP 内置开发支付按钮，真实上线请配置 Stripe/Crypto Webhook。</p>
          {error && <p className="mt-4 rounded-2xl bg-red-500/10 p-3 text-red-200">{error}</p>}
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {loadingPlans && (
            <div className="glass rounded-3xl p-6 text-center text-slate-300 md:col-span-3">
              套餐加载中...
            </div>
          )}
          {plans.map((plan) => (
            <div key={plan.id} className="glass rounded-3xl p-6">
              <h2 className="text-2xl font-bold">{plan.name}</h2>
              <p className="mt-3 min-h-12 text-sm text-slate-400">{plan.description}</p>
              <p className="mt-8 text-4xl font-black">{money(plan.priceCents, plan.currency)}</p>
              <p className="mt-2 text-sm text-slate-400">
                {plan.durationDays} 天 · {plan.trafficLimitGb}GB · {plan.maxDevices} 台设备
              </p>
              <div className="mt-8 grid gap-3">
                <button
                  onClick={() => buy(plan.id, "stripe")}
                  disabled={loadingId === `${plan.id}-stripe`}
                  className="rounded-2xl bg-brand-600 p-3 font-semibold hover:bg-brand-500 disabled:opacity-50"
                >
                  {loadingId === `${plan.id}-stripe` ? "处理中..." : "Stripe / 卡 / 支付宝微信"}
                </button>
                <button
                  onClick={() => buy(plan.id, "crypto")}
                  disabled={loadingId === `${plan.id}-crypto`}
                  className="rounded-2xl border border-white/10 p-3 font-semibold hover:bg-white/10 disabled:opacity-50"
                >
                  Crypto 支付
                </button>
                <button
                  onClick={() => buy(plan.id, "dev")}
                  disabled={loadingId === `${plan.id}-dev`}
                  className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  开发测试：模拟支付成功
                </button>
              </div>
            </div>
          ))}
          {!loadingPlans && !plans.length && (
            <div className="glass rounded-3xl p-6 text-center text-slate-300 md:col-span-3">
              暂无可购买套餐，请稍后再试。
            </div>
          )}
        </div>
        <p className="mt-8 text-center text-sm text-slate-500">
          未登录？先去 <Link href="/login" className="text-blue-300">登录</Link> 或 <Link href="/register" className="text-blue-300">注册</Link>
        </p>
      </section>
    </main>
  );
}
