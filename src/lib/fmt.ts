export function money(value: number, currency = "MXN") {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function n(v: string | number | null | undefined) {
  if (v === null || v === undefined) return 0;
  const num = typeof v === "number" ? v : Number.parseFloat(String(v));
  return Number.isFinite(num) ? num : 0;
}

export function dt(v: Date | string | null | undefined) {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}
