const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>)
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `HTTP_${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/plain")) {
    return (await response.text()) as T;
  }
  return response.json() as Promise<T>;
}

export function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(cents / 100);
}
