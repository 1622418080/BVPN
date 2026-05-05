import Link from "next/link";
import { Nav } from "../components/Nav";

const features = [
  "WireGuard 高性能协议",
  "订阅到期自动控制",
  "多节点扩展架构",
  "支付成功自动开通",
  "用户 Dashboard 下载配置",
  "后端 API 可扩展微信/支付宝/加密货币支付"
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,#1d4ed8,transparent_35%),radial-gradient(circle_at_top_right,#7c3aed,transparent_30%)]" />
      <Nav />
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-200">
            BVPN SaaS Starter · WireGuard 自动化开通
          </p>
          <h1 className="text-5xl font-black tracking-tight md:text-7xl">
            搭建你的 VPN 订阅管理平台
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            从套餐、订单、支付、订阅到 WireGuard 配置生成，一套可扩展的全栈 MVP。
          </p>
          <div className="mt-10 flex gap-4">
            <Link href="/pricing" className="rounded-full bg-brand-600 px-7 py-3 font-semibold hover:bg-brand-500">
              查看套餐
            </Link>
            <Link href="/dashboard" className="rounded-full border border-white/15 px-7 py-3 font-semibold hover:bg-white/10">
              进入后台
            </Link>
          </div>
        </div>
        <div className="glass rounded-3xl p-6">
          <div className="rounded-2xl bg-slate-950/80 p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">当前订阅</p>
                <h3 className="text-2xl font-bold">Pro Plan</h3>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300">Active</span>
            </div>
            <div className="grid gap-4">
              {features.map((feature) => (
                <div key={feature} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-200">
                  ✓ {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
