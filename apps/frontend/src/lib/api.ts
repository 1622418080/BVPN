const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("bvpn_token") || "";
}

export function setToken(token: string) {
  localStorage.setItem("bvpn_token", token);
}

export function logout() {
  localStorage.removeItem("bvpn_token");
  window.location.href = "/login";
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    if (response.status === 401) {
      logout();
      throw new Error("登录已过期，请重新登录");
    }
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json().catch(() => ({}))
      : {};
    throw new Error(data.error || data.message || `HTTP_${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/plain")) {
    return (await response.text()) as T;
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(cents / 100);
}
