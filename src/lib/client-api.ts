// Client-side API helper. Attaches the Bearer token automatically.
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T = Record<string, unknown>>(
  path: string,
  opts?: { method?: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown }
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("fin_token") : null;
  const res = await fetch(path, {
    method: opts?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok || data.ok === false) {
    throw new ApiError((data.error as string) || "Something went wrong. Please try again.", res.status);
  }
  return data as T;
}
