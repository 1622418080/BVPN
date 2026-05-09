import Link from "next/link";
import { Nav } from "../components/Nav";

const features = [
  {
    title: "WireGuard 协议",
    desc: "基于高性能 WireGuard 协议，低延迟、高吞吐，安全可靠。"
  },
  {
    title: "自动开通",
    desc: "支付成功自动生成配置，无需人工干预，即买即用。"
  },
  {
    title: "多节点覆盖",
    desc: "全球多节点接入，智能选择最优线路，保障连接稳定性。"
  },
  {
    title: "多设备支持",
    desc: "一套订阅支持多台设备同时在线，电脑手机均可使用。"
  },
  {
    title: "流量透明",
    desc: "实时查看流量使用情况，到期自动提醒，用量一目了然。"
  },
  {
    title: "支付灵活",
    desc: "支持多种支付方式，按需选择套餐，灵活订阅。"
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <div className="fixed inset-0 -z-10 bg-grid" />
      <div className="fixed inset-0 -z-10 bg-glow" />
      <div className="fixed inset-0 -z-10 bg-glow-alt" />

      <Nav />

      <section className="mx-auto max-w-6xl px-6 pt-24 pb-20 text-center">
        <Link
          href="/pricing"
          className="mb-8 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/60 transition-colors hover:border-white/20 hover:text-white/80"
        >
          BVPN SaaS Starter &middot; WireGuard 自动化开通
          <span className="ml-1 text-white/30">&rarr;</span>
        </Link>

        <h1 className="mx-auto max-w-4xl text-5xl font-medium leading-tight tracking-tight md:text-7xl">
          搭建你的
          <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent"> VPN 订阅</span>
          <br />
          管理平台
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/50">
          从套餐、订单、支付、订阅到 WireGuard 配置生成，
          <br />
          一套可扩展的全栈 MVP，快速启动你的 VPN 业务。
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/pricing"
            className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition-all hover:bg-white/90"
          >
            查看套餐
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 px-6 py-3 font-medium text-white/70 transition-all hover:bg-white/5 hover:text-white"
          >
            进入后台
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.06] md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="bg-[#0a0a0a] p-8">
              <h3 className="text-base font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/40">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-white/30">
          <span>&copy; {new Date().getFullYear()} BVPN</span>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="transition-colors hover:text-white/60">套餐</Link>
            <Link href="/login" className="transition-colors hover:text-white/60">登录</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
