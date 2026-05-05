# BVPN 部署教程：从服务器到 WireGuard 自动开通

下面以 Ubuntu LTS 为例。正式上线前请把所有示例密钥换成强随机值。

## 1. 服务器规划

推荐至少两台服务器：

```text
主站服务器：
- frontend
- backend
- PostgreSQL
- Redis
- Nginx + HTTPS

VPN 节点服务器：
- WireGuard
- apps/agent
```

测试阶段也可以全放一台机器，但正式商业化建议分离。

## 2. 主站服务器安装基础环境

```bash
sudo apt update
sudo apt install -y git curl nginx certbot python3-certbot-nginx
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

重新登录后确认：

```bash
docker --version
docker compose version
```

## 3. 获取代码与配置环境变量

```bash
git clone <你的仓库地址> bvpn
cd bvpn
cp .env.example .env
nano .env
```

重点修改：

```env
APP_URL=https://bvpn.com
API_URL=https://api.bvpn.com
DATABASE_URL=postgresql://bvpn:强密码@postgres:5432/bvpn?schema=public
JWT_SECRET=至少32位随机字符串
AGENT_URL=https://你的节点-agent-内网或公网地址
AGENT_TOKEN=至少32位随机字符串
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## 4. 启动主站服务

```bash
docker compose up -d postgres redis
docker compose run --rm backend npm run prisma:migrate
docker compose run --rm backend npm run seed
docker compose up -d backend frontend
```

检查：

```bash
curl http://127.0.0.1:4000/health
curl http://127.0.0.1:3000
```

## 5. 域名和 HTTPS

DNS 解析示例：

```text
bvpn.com      A  主站服务器IP
www.bvpn.com  A  主站服务器IP
api.bvpn.com  A  主站服务器IP
```

复制 `infra/nginx.conf` 到 Nginx 配置目录并改证书路径：

```bash
sudo cp infra/nginx.conf /etc/nginx/sites-available/bvpn.conf
sudo ln -s /etc/nginx/sites-available/bvpn.conf /etc/nginx/sites-enabled/bvpn.conf
sudo nginx -t
sudo systemctl reload nginx
```

申请证书：

```bash
sudo certbot --nginx -d bvpn.com -d www.bvpn.com -d api.bvpn.com
```

## 6. VPN 节点安装 WireGuard

在 VPN 节点服务器执行：

```bash
sudo apt update
sudo apt install -y wireguard wireguard-tools
wg genkey | sudo tee /etc/wireguard/server_private.key
sudo cat /etc/wireguard/server_private.key | wg pubkey | sudo tee /etc/wireguard/server_public.key
```

创建 `/etc/wireguard/wg0.conf`：

```ini
[Interface]
Address = 10.8.0.1/24
ListenPort = 51820
PrivateKey = <server_private_key>
PostUp = sysctl -w net.ipv4.ip_forward=1; iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE
PostDown = iptables -t nat -D POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE
```

启动：

```bash
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0
sudo wg show
```

开放 UDP 端口：

```bash
sudo ufw allow 51820/udp
```

## 7. 部署 Agent

节点上的 `.env` 至少需要：

```env
AGENT_PORT=4100
AGENT_TOKEN=和主站一致的强随机值
WG_INTERFACE=wg0
WG_SERVER_PUBLIC_KEY=上一步生成的 server_public_key
WG_SERVER_ENDPOINT=节点公网IP或域名:51820
WG_DNS=1.1.1.1
WG_ADDRESS_CIDR=10.8.0.0/24
WG_DRY_RUN=false
```

生产环境 Agent 不建议直接暴露公网。优先使用：

```text
方案 A：主站和节点走内网/VPC
方案 B：Nginx 反代 + HTTPS + IP 白名单
方案 C：mTLS
```

Agent 启动方式：

```bash
npm install
npm run build -w apps/agent
AGENT_TOKEN=xxx WG_DRY_RUN=false npm run start -w apps/agent
```

或使用 Docker，但需要 `NET_ADMIN` 能力：

```bash
docker compose up -d agent
```

## 8. 支付配置

### Stripe

1. 在 Stripe 后台创建账号并完成 KYC。
2. 启用你所在地区支持的支付方式，例如银行卡、Alipay、WeChat Pay。
3. 创建 Webhook：

```text
https://api.bvpn.com/payments/stripe/webhook
```

监听事件：

```text
checkout.session.completed
```

4. 把密钥填入 `.env`：

```env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### 微信/支付宝服务商模式

当前代码留了支付模块位置。你可以后续新增：

```text
POST /payments/wechat/create
POST /payments/wechat/notify
POST /payments/alipay/create
POST /payments/alipay/notify
```

必须做：

- 验签
- 幂等处理
- 金额校验
- 只用异步回调确认支付成功

### Crypto 网关

建议接 Coinbase Commerce、BitPay 或 NOWPayments。流程：

```text
创建 invoice -> 用户支付 -> webhook -> 验签 -> activatePaidOrder(orderId)
```

不要在中国大陆面向公众推广虚拟货币支付。

## 9. 测试完整流程

本地开发可用“模拟支付成功”按钮：

```text
注册 -> 套餐页 -> 开发测试：模拟支付成功 -> Dashboard -> 下载 bvpn.conf
```

生产环境测试：

```text
Stripe 测试模式支付 -> Webhook 收到 checkout.session.completed -> 订单 PAID -> 创建 subscription -> 调用 Agent -> 生成 WireGuard 配置
```

## 10. 上线前安全清单

- 删除或关闭 `/payments/dev/mark-paid`
- 设置强 `JWT_SECRET`、`AGENT_TOKEN`
- 设置 `ENABLE_DEV_PAYMENTS=false`
- 后端和 Agent 只走 HTTPS
- Agent 加 IP 白名单或 mTLS
- 数据库定期备份
- 管理员启用 2FA
- 支付 Webhook 必须验签
- 订单必须校验金额和币种
- WireGuard 私钥不要明文存主站数据库
- 日志不要打印支付密钥、JWT、VPN 私钥
