import { Router } from "express";
import Stripe from "stripe";
import { z } from "zod";
import { config } from "../config.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { activatePaidOrder } from "../services/provision.js";

export const paymentsRouter = Router();

let stripeInstance: Stripe | null = null;
let stripeChecked = false;

function getStripe(): Stripe | null {
  if (stripeChecked) return stripeInstance;
  stripeChecked = true;
  if (config.STRIPE_SECRET_KEY) {
    stripeInstance = new Stripe(config.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
}

function buildLineItem(order: { amountCents: number; currency: string; plan: { name: string } }) {
  return {
    quantity: 1,
    price_data: {
      currency: order.currency.toLowerCase(),
      unit_amount: order.amountCents,
      product_data: { name: `BVPN ${order.plan.name}` }
    }
  };
}

paymentsRouter.post("/stripe/checkout", requireAuth, asyncHandler(async (req, res, next) => {
  const { orderId } = z.object({ orderId: z.string() }).parse(req.body);
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: req.auth!.sub },
    include: { plan: true }
  });
  if (!order) return res.status(404).json({ error: "ORDER_NOT_FOUND" });

  const stripe = getStripe();
  if (!stripe) {
    return res.status(501).json({
      error: "STRIPE_NOT_CONFIGURED",
      hint: "Set STRIPE_SECRET_KEY to enable Stripe payments."
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: order.id,
    customer_email: req.auth!.email,
    line_items: [buildLineItem(order)],
    success_url: `${config.APP_URL}/dashboard?paid=1`,
    cancel_url: `${config.APP_URL}/pricing?cancelled=1`,
    metadata: { orderId: order.id }
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentChannel: "stripe", providerRef: session.id, checkoutUrl: session.url }
  });

  res.json({ checkoutUrl: session.url });
}));

paymentsRouter.post("/stripe/webhook", async (req, res) => {
  const stripe = getStripe();
  if (!stripe || !config.STRIPE_WEBHOOK_SECRET) {
    return res.status(501).json({ error: "STRIPE_WEBHOOK_NOT_CONFIGURED" });
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || Array.isArray(signature)) {
    return res.status(400).send("Missing stripe-signature header");
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      config.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).send(`Webhook signature verification failed: ${error instanceof Error ? error.message : "unknown"}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId || session.client_reference_id;
    if (orderId) {
      const exists = await prisma.payment.findFirst({
        where: { orderId, providerTradeNo: session.id }
      });
      if (!exists) {
        await prisma.payment.create({
          data: { orderId, channel: "stripe", providerTradeNo: session.id, status: "paid" }
        });
      }
      await activatePaidOrder(orderId);
    }
  }

  res.json({ received: true });
});

paymentsRouter.post("/crypto/create", requireAuth, asyncHandler(async (req, res, next) => {
  const { orderId } = z.object({ orderId: z.string() }).parse(req.body);
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: req.auth!.sub },
    include: { plan: true }
  });
  if (!order) return res.status(404).json({ error: "ORDER_NOT_FOUND" });

  if (!config.CRYPTO_API_KEY) {
    return res.status(501).json({
      error: "CRYPTO_NOT_CONFIGURED",
      hint: "Set CRYPTO_API_KEY to enable crypto payments (NOWPayments/Coinbase Commerce)."
    });
  }

  // MVP placeholder: replace with actual NOWPayments/Coinbase invoice creation
  const checkoutUrl = `${config.APP_URL}/dashboard/billing?crypto_order=${order.id}`;
  await prisma.order.update({
    where: { id: order.id },
    data: { paymentChannel: "crypto", checkoutUrl }
  });

  res.json({ checkoutUrl });
}));

paymentsRouter.post("/dev/mark-paid", requireAuth, asyncHandler(async (req, res, next) => {
  if (!config.ENABLE_DEV_PAYMENTS) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }
  const { orderId } = z.object({ orderId: z.string() }).parse(req.body);
  const order = await prisma.order.findFirst({ where: { id: orderId, userId: req.auth!.sub } });
  if (!order) return res.status(404).json({ error: "ORDER_NOT_FOUND" });
  const paid = await activatePaidOrder(order.id);
  res.json({ order: paid });
}));
