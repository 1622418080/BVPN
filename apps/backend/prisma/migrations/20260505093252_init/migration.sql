-- DropIndex
DROP INDEX "Order_userId_idx";

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Order_providerRef_idx" ON "Order"("providerRef");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_providerTradeNo_idx" ON "Payment"("providerTradeNo");

-- CreateIndex
CREATE INDEX "Plan_isActive_priceCents_idx" ON "Plan"("isActive", "priceCents");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_endAt_idx" ON "Subscription"("userId", "status", "endAt");

-- CreateIndex
CREATE INDEX "Subscription_status_endAt_idx" ON "Subscription"("status", "endAt");

-- CreateIndex
CREATE INDEX "VpnAccount_userId_isActive_idx" ON "VpnAccount"("userId", "isActive");

-- CreateIndex
CREATE INDEX "VpnNode_isActive_idx" ON "VpnNode"("isActive");
