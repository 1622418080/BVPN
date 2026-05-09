export type Plan = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  durationDays: number;
  trafficLimitGb: number;
  maxDevices: number;
};

export type Order = {
  id: string;
  status: "PENDING" | "PAID" | "CANCELLED" | "EXPIRED";
  amountCents: number;
  currency: string;
  createdAt: string;
  plan: { name: string };
};

export type VpnAccount = {
  id: string;
  assignedIp: string;
  publicKey: string;
  node: { name: string; region: string };
};

export type DashboardData = {
  subscription?: {
    status: string;
    endAt: string;
    trafficLimitGb: number;
    plan: { name: string };
  } | null;
  orders: Order[];
  accounts: VpnAccount[];
};

export type AuthResponse = {
  token: string;
  user: { id: string; email: string; role: "USER" | "ADMIN" };
};

export type PlansResponse = {
  plans: Plan[];
};

export type DashboardResponse = DashboardData;

// Admin types
export type AdminStats = {
  totalUsers: number;
  activeSubscriptions: number;
  totalOrders: number;
  paidOrders: number;
  totalRevenueCents: number;
};

export type AdminUser = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminUsersResponse = {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
};

export type AdminOrder = {
  id: string;
  status: string;
  amountCents: number;
  currency: string;
  createdAt: string;
  plan: { name: string };
  user: { id: string; email: string };
};

export type AdminOrdersResponse = {
  orders: AdminOrder[];
  total: number;
  page: number;
  totalPages: number;
};

export type AdminSubscription = {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  trafficLimitGb: number;
  plan: { name: string };
  user: { id: string; email: string };
};

export type AdminSubscriptionsResponse = {
  subscriptions: AdminSubscription[];
  total: number;
  page: number;
  totalPages: number;
};
