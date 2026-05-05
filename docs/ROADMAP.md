# BVPN 后续开发路线

## 第一阶段：MVP

- [x] 注册登录
- [x] 套餐列表
- [x] 订单创建
- [x] Stripe Checkout 骨架
- [x] Crypto 支付骨架
- [x] 开发环境模拟支付
- [x] 支付成功后自动创建订阅
- [x] 调用 WireGuard Agent 生成配置
- [x] 用户 Dashboard 下载配置

## 第二阶段：商业化

- 管理后台：用户、订单、套餐、节点
- 邮箱验证码与找回密码
- 优惠码
- 工单系统
- 多节点选择和负载均衡
- 流量统计与超额暂停
- Stripe 真实支付和 Webhook 完整验签
- NOWPayments/Coinbase Commerce webhook

## 第三阶段：运维增强

- Agent mTLS
- 节点心跳
- 自动下发/删除 Peer
- Prometheus + Grafana
- PostgreSQL 自动备份
- 异常登录风控
- Cloudflare WAF
