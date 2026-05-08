"use client";
import type { AppConfig, Quote, Receipt, Stats } from "@/components/crm-shell";
import { money, n, dt } from "@/lib/fmt";
import { Users, FileText, Receipt as ReceiptIcon, TrendingUp, ArrowRight, Plus, AlertCircle } from "@/components/icons";

type Props = {
  stats: Stats;
  config: AppConfig;
  receiptRows: Receipt[];
  quoteRows: Quote[];
  onNavigate: (view: "clientes" | "cotizaciones" | "recibos" | "servicios" | "config" | "dashboard") => void;
};

export function Dashboard({ stats, config, receiptRows, quoteRows, onNavigate }: Props) {
  const cur = config.currency || "MXN";

  const recentActivity = [
    ...receiptRows.slice(0, 5).map((r) => ({
      type: "recibo" as const,
      label: `Recibo ${r.receiptNumber ?? `REC-${r.id}`}`,
      detail: r.clientName || "sin cliente",
      amount: n(r.total),
      status: r.status,
      date: r.createdAt,
    })),
    ...quoteRows.slice(0, 5).map((q) => ({
      type: "cotizacion" as const,
      label: `Cotización ${q.quoteNumber ?? `COT-${q.id}`}`,
      detail: q.clientName || "sin cliente",
      amount: n(q.total),
      status: q.status,
      date: q.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const pendingReceipts = receiptRows.filter((r) => r.status === "pendiente" || r.status === "parcial");
  const pendingTotal = pendingReceipts.reduce((sum, r) => sum + n(r.balance), 0);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">
          Buen día
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Resumen de {config.businessName}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Clientes"
          value={stats.clients.toString()}
          Icon={Users}
          color="blue"
          onClick={() => onNavigate("clientes")}
        />
        <StatCard
          label="Cotizaciones"
          value={stats.quotes.toString()}
          Icon={FileText}
          color="sky"
          onClick={() => onNavigate("cotizaciones")}
        />
        <StatCard
          label="Recibos"
          value={stats.receipts.toString()}
          Icon={ReceiptIcon}
          color="emerald"
          onClick={() => onNavigate("recibos")}
        />
        <StatCard
          label="Ventas pagadas"
          value={money(stats.sales, cur)}
          Icon={TrendingUp}
          color="amber"
          onClick={() => onNavigate("recibos")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pending balance */}
        {pendingReceipts.length > 0 && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-600" />
                <h2 className="text-sm font-semibold text-amber-800">Saldo por cobrar</h2>
              </div>
              <span className="text-xs text-amber-600">{pendingReceipts.length} recibos</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">{money(pendingTotal, cur)}</p>
            <div className="mt-3 space-y-2">
              {pendingReceipts.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs text-amber-700">
                  <span className="truncate">{r.receiptNumber} · {r.clientName || "sin cliente"}</span>
                  <span className="font-medium ml-2 shrink-0">{money(n(r.balance), cur)}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigate("recibos")}
              className="mt-3 text-xs font-medium text-amber-700 hover:text-amber-900 inline-flex items-center gap-1"
            >
              Ver todos <ArrowRight size={12} />
            </button>
          </div>
        )}

        {/* Recent activity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Actividad reciente</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Sin actividad todavía.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      a.type === "recibo" ? "bg-emerald-400" : "bg-blue-400"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate">{a.label}</p>
                    <p className="text-xs text-slate-400">{a.detail}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-700">{money(a.amount, cur)}</p>
                    <p className="text-xs text-slate-400">{dt(a.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 mb-3">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { label: "Nueva cotización", view: "cotizaciones" },
              { label: "Nuevo recibo", view: "recibos" },
              { label: "Nuevo cliente", view: "clientes" },
              { label: "Nuevo servicio", view: "servicios" },
            ] as const
          ).map((a) => (
            <button
              key={a.view}
              onClick={() => onNavigate(a.view)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  Icon,
  color,
  onClick,
}: {
  label: string;
  value: string;
  Icon: React.FC<{ size?: number; className?: string }>;
  color: "blue" | "sky" | "emerald" | "amber";
  onClick: () => void;
}) {
  const bg = {
    blue: "bg-blue-50 border-blue-200",
    sky: "bg-sky-50 border-sky-200",
    emerald: "bg-emerald-50 border-emerald-200",
    amber: "bg-amber-50 border-amber-200",
  }[color];

  const iconBg = {
    blue: "bg-blue-100 text-blue-600",
    sky: "bg-sky-100 text-sky-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
  }[color];

  const valueColor = {
    blue: "text-blue-700",
    sky: "text-sky-700",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
  }[color];

  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition-shadow hover:shadow-md ${bg}`}
    >
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon size={18} />
      </div>
      <p className={`mt-3 text-xl font-bold truncate ${valueColor}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </button>
  );
}
