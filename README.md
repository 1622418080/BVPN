# BVPN — WireGuard 订阅制 VPN 网站 MVP

这是一个从零搭建的全栈模板，包含：

- 前端：Next.js + Tailwind CSS
- 后端：Express + TypeScript + Prisma
- 数据库：PostgreSQL
- 缓存：Redis
- VPN 节点 Agent：WireGuard 自动开通/生成配置
- 支付：Stripe Checkout 占位、Crypto 网关占位、微信/支付宝服务商接入预留
- 部署：Docker Compose + Nginx 示例

> 合规提醒：VPN、支付、虚拟货币收款在不同国家/地区监管要求不同。上线前请确认你有合法资质，不要使用个人收款码、跑分、码商或伪装行业等方式。

## 目录

```text
bvpn/
├─ apps/
│  ├─ backend/       # API、订单、支付回调、订阅、调用 VPN agent
│  ├─ frontend/      # 官网、价格页、用户 Dashboard
│  └─ agent/         # 部署在每台 VPN 节点上的 WireGuard 管理服务
├─ infra/
│  └─ nginx.conf
├─ docker-compose.yml
├─ .env.example
└─ package.json
```

## 本地启动

### 方式一：直接运行

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
make dev
```

Windows PowerShell 如果提示 `npm.ps1` 被禁止执行，请把上面的 `npm` 临时替换成 `npm.cmd`。

### 方式二：Docker Compose（开发模式，含热重载）

```bash
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

或使用 Makefile：

```bash
make up-dev
```

### 方式三：Docker Compose（生产模式）

```bash
make up
```

### 验证

- 类型检查：`make typecheck`
- 构建：`make build`
- 初始化数据：`make seed`

访问：

- 前端：http://localhost:3000
- 后端：http://localhost:4000/health
- Agent：http://localhost:4100/health

## 生产部署简述

1. 主站服务器安装 Docker、Docker Compose、Nginx、Certbot。
2. VPN 节点服务器安装 WireGuard，并运行 `apps/agent`。
3. 后端配置 `AGENT_URL` 和 `AGENT_TOKEN`。
4. 配置 Stripe / Crypto 支付 Webhook。
5. 确认支付回调只接受 HTTPS。

更详细的步骤见 `docs/DEPLOY.md`。
