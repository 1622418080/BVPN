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
    subtitle: "输入你的邮箱和密码进入 Dashboard。",
    button: "登录",
    footer: { text: "没有账号？", link: "/register", label: "注册" },
    redirect: "/dashboard"
  },
  register: {
    title: "创建账户",
    subtitle: "注册后选择套餐，支付成功自动开通 WireGuard。",
    button: "注册",
    footer: { text: "已有账号？", link: "/login", label: "登录" },
    redirect: "/pricing"
  }
} as const;

export function AuthForm({ mode }: Props) {
  const { title, subtitle, button, footer, redirect } = config[mode];
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
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
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <form onSubmit={submit} className="glass w-full max-w-md rounded-3xl p-8">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
        <input
          name="email"
          type="email"
          placeholder="邮箱"
          className="mt-8 w-full rounded-2xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-blue-400"
          required
        />
        <input
          name="password"
          type="password"
          minLength={mode === "register" ? 8 : undefined}
          placeholder={mode === "register" ? "密码，至少 8 位" : "密码"}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-blue-400"
          required
        />
        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        <button className="mt-6 w-full rounded-2xl bg-brand-600 p-4 font-semibold hover:bg-brand-500">
          {button}
        </button>
        <p className="mt-5 text-center text-sm text-slate-400">
          {footer.text}
          <Link href={footer.link} className="text-blue-300">
            {footer.label}
          </Link>
        </p>
      </form>
    </main>
  );
}
