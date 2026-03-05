export const API_BASE =
  (typeof process !== "undefined" && process.env.EXPO_PUBLIC_API_URL) ||
  "http://localhost:8000";

export async function apiFetch<T = unknown>(
  path: string,
  token?: string | null,
  options?: RequestInit & { body?: Record<string, unknown> }
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    method: options?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string>),
    },
    body: options?.body ? JSON.stringify(options.body) : options?.body as BodyInit,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail || "API error");
  }
  return res.json();
}
