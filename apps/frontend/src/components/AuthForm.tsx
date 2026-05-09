"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { api, setToken } from "../lib/api";

type Props = {
  mode: "login" | "register";
};

const config = {
  login: {
    title: "登录 BVPN",
    subtitle: "欢迎回来，请输入你的账号密码。",
    button: "登录",
    footer: { text: "还没有账号？", link: "/register", label: "立即注册" },
    redirect: "/dashboard",
    bgGradient: "from-slate-950 via-indigo-950 to-slate-950",
    cardBg: "bg-indigo-950/70 border-indigo-500/20",
    badge: "bg-indigo-500/20 text-indigo-200 border border-indigo-400/30",
    inputBg: "bg-slate-900 border-slate-700 focus:border-indigo-400",
    btnStyle: "bg-indigo-600 hover:bg-indigo-500",
    icon: "🔐"
  },
  register: {
    title: "创建账户",
    subtitle: "注册后选择套餐，支付成功自动开通 VPN。",
    button: "注册",
    footer: { text: "已有账号？", link: "/login", label: "直接登录" },
    redirect: "/pricing",
    bgGradient: "from-slate-950 via-amber-950 to-slate-950",
    cardBg: "bg-amber-950/70 border-amber-500/20",
    badge: "bg-amber-500/20 text-amber-200 border border-amber-400/30",
    inputBg: "bg-slate-900 border-slate-700 focus:border-amber-400",
    btnStyle: "bg-amber-600 hover:bg-amber-500",
    icon: "🚀"
  }
} as const;

export function AuthForm({ mode }: Props) {
  const { title, subtitle, button, footer, redirect, bgGradient, cardBg, badge, inputBg, btnStyle, icon } = config[mode];
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const data = await api<{ token: string }>(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password")
        })
      });
      setToken(data.token);
      window.location.href = redirect;
    } catch (e) {
      setError(e instanceof Error ? e.message : `${button}失败`);
      setSubmitting(false);
    }
  }

  return (
    <main className={`grid min-h-screen place-items-center px-6 bg-gradient-to-br ${bgGradient}`}>
      <form onSubmit={submit} className={`w-full max-w-md rounded-3xl ${cardBg} border p-8 shadow-2xl backdrop-blur-xl`}>
        <div className="text-center mb-2">
          <span className="text-4xl">{icon}</span>
        </div>
        <div className={`mx-auto mb-6 w-fit rounded-full ${badge} px-4 py-1.5 text-sm`}>
          {mode === "login" ? "登录页面" : "注册页面"}
        </div>
        <h1 className="text-3xl font-bold text-center">{title}</h1>
        <p className="mt-2 text-sm text-center text-slate-400">{subtitle}</p>
        <input
          name="email"
          type="email"
          placeholder="邮箱地址"
          className={`mt-8 w-full rounded-2xl border ${inputBg} p-4 outline-none transition`}
          required
        />
        <input
          name="password"
          type="password"
          minLength={mode === "register" ? 8 : undefined}
          placeholder={mode === "register" ? "密码（至少 8 位）" : "密码"}
          className={`mt-4 w-full rounded-2xl border ${inputBg} p-4 outline-none transition`}
          required
        />
        {error && (
          <p className="mt-4 rounded-2xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-200">{error}</p>
        )}
        <button
          disabled={submitting}
          className={`mt-6 w-full rounded-2xl p-4 font-semibold transition text-white disabled:cursor-not-allowed disabled:opacity-60 ${btnStyle}`}
        >
          {submitting ? "处理中..." : button}
        </button>
        <p className="mt-5 text-center text-sm text-slate-400">
          {footer.text}{" "}
          <Link href={footer.link} className="font-medium text-sky-300 hover:text-sky-200 underline underline-offset-2">
            {footer.label}
          </Link>
        </p>
      </form>
    </main>
  );
}
