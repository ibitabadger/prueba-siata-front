/**
 * Normaliza cualquier error de la API (Pydantic 422, string, array, etc.)
 * a un string legible para mostrar en la UI.
 */
export function parseApiError(err: unknown, fallback = "Ha ocurrido un error."): string {
  const detail = (err as any)?.response?.data?.detail ?? (err as any)?.message ?? null;

  if (!detail) return fallback;

  // Pydantic 422: array de objetos [{loc, msg, type}]
  if (Array.isArray(detail)) {
    return detail
      .map((e: any) => {
        const loc = Array.isArray(e?.loc)
          ? e.loc.filter((l: unknown) => l !== "body").join(" → ")
          : "";
        const msg = e?.msg ?? String(e);
        return loc ? `${loc}: ${msg}` : msg;
      })
      .join(" | ");
  }

  if (typeof detail === "string") return detail;

  return String(detail) || fallback;
}
