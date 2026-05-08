type Props = { label: string; variant?: "green" | "yellow" | "red" | "blue" | "gray" | "sky" };

const variants = {
  green: "bg-emerald-100 text-emerald-700",
  yellow: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  gray: "bg-slate-100 text-slate-600",
  sky: "bg-sky-100 text-sky-700",
};

export function Badge({ label, variant = "gray" }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}>
      {label}
    </span>
  );
}

export function statusBadge(status: string) {
  const map: Record<string, { label: string; variant: Props["variant"] }> = {
    draft: { label: "Borrador", variant: "gray" },
    sent: { label: "Enviada", variant: "blue" },
    accepted: { label: "Aceptada", variant: "green" },
    rejected: { label: "Rechazada", variant: "red" },
    pendiente: { label: "Pendiente", variant: "yellow" },
    parcial: { label: "Parcial", variant: "sky" },
    pagado: { label: "Pagado", variant: "green" },
    cancelado: { label: "Cancelado", variant: "red" },
  };
  const found = map[status] ?? { label: status, variant: "gray" as const };
  return <Badge label={found.label} variant={found.variant} />;
}
