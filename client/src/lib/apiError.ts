/** Ubah `error` dari API (string atau Zod flatten) jadi teks yang bisa ditampilkan. */
export function messageFromApiError(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const err = (body as { error?: unknown }).error;
  if (typeof err === "string" && err.length > 0) return err;
  if (err && typeof err === "object") {
    const flat = err as {
      formErrors?: string[];
      fieldErrors?: Record<string, string[]>;
    };
    const parts: string[] = [...(flat.formErrors ?? [])];
    if (flat.fieldErrors) {
      for (const [field, msgs] of Object.entries(flat.fieldErrors)) {
        for (const m of msgs) parts.push(`${field}: ${m}`);
      }
    }
    if (parts.length > 0) return parts.join(" · ");
  }
  return fallback;
}
