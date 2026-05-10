"use client";

import { useState, useTransition, useCallback } from "react";
import { Dashboard } from "./views/dashboard";
import { ClientsView } from "./views/clients";
import { ServicesView } from "./views/services";
import { QuotesView } from "./views/quotes";
import { ReceiptsView } from "./views/receipts";
import { SettingsView } from "./views/settings-view";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Receipt,
  Settings,
  Menu,
  X,
} from "@/components/icons";

// ── Type exports used across views ──────────────────────────────────────────
export type AppConfig = {
  id: number;
  businessName: string;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  currency: string;
  defaultTaxRate: string;
  bankName: string | null;
  bankAccount: string | null;
  bankClabe: string | null;
  bankBeneficiary: string | null;
  qrPayload: string | null;
  updatedAt: Date;
};

export type Client = {
  id: number;
  fullName: string;
  companyName: string | null;
  representativeName: string | null;
  role: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: Date;
};

export type Service = {
  id: number;
  name: string;
  description: string | null;
  unit: string;
  basePrice: string;
  createdAt: Date;
};

export type Quote = {
  id: number;
  quoteNumber: string | null;
  title: string;
  status: string;
  currency: string;
  applyTax: boolean;
  taxRate: string;
  subtotal: string;
  taxAmount: string;
  total: string;
  validUntil: string | null;
  notes: string | null;
  createdAt: Date;
  clientId: number | null;
  clientName: string | null;
};

export type QuoteItem = {
  id: number;
  quoteId: number;
  serviceId: number | null;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  lineTotal: string;
  createdAt: Date;
};

export type Receipt = {
  id: number;
  receiptNumber: string | null;
  currency: string;
  applyTax: boolean;
  taxRate: string;
  subtotal: string;
  taxAmount: string;
  total: string;
  paidAmount: string;
  balance: string;
  paymentMethod: string;
  status: string;
  notes: string | null;
  issuedAt: Date;
  createdAt: Date;
  clientId: number | null;
  quoteId: number | null;
  clientName: string | null;
};

export type ReceiptItem = {
  id: number;
  receiptId: number;
  serviceId: number | null;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  lineTotal: string;
  createdAt: Date;
};

export type Payment = {
  id: number;
  receiptId: number;
  amount: string;
  method: string;
  note: string | null;
  paidAt: Date;
  createdAt: Date;
};

export type Stats = {
  clients: number;
  quotes: number;
  receipts: number;
  sales: number;
};

type View = "dashboard" | "clientes" | "servicios" | "cotizaciones" | "recibos" | "config";

const NAV_ITEMS: { id: View; label: string; Icon: React.FC<{ size?: number; className?: string }> }[] = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "clientes", label: "Clientes", Icon: Users },
  { id: "servicios", label: "Servicios", Icon: Briefcase },
  { id: "cotizaciones", label: "Cotizaciones", Icon: FileText },
  { id: "recibos", label: "Recibos", Icon: Receipt },
  { id: "config", label: "Configuración", Icon: Settings },
];

type Props = {
  config: AppConfig;
  clientRows: Client[];
  serviceRows: Service[];
  quoteRows: Quote[];
  receiptRows: Receipt[];
  quoteItemsByQuote: Map<number, QuoteItem[]>;
  receiptItemsByReceipt: Map<number, ReceiptItem[]>;
  paymentsByReceipt: Map<number, Payment[]>;
  stats: Stats;
};

export function CrmShell(props: Props) {
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, startTransition] = useTransition();

  const navigate = useCallback((view: View) => {
    startTransition(() => setActiveView(view));
    setSidebarOpen(false);
  }, []);

  const businessName = props.config.businessName || "Órbita CRM";
  const initials = businessName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-[#0f1d36] text-white transition-transform duration-300
          lg:relative lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-blue-900/50">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate leading-tight">{businessName}</p>
            <p className="text-[11px] text-blue-300/70">Órbita CRM</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded-lg p-1.5 hover:bg-white/10 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`
                flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors mb-1
                ${activeView === id
                  ? "bg-blue-600/20 text-blue-300 font-medium"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"}
              `}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main area ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar — BOTÓN DE MENÚ ELIMINADO DE AQUÍ */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            {NAV_ITEMS.find((n) => n.id === activeView)?.Icon &&
              (() => {
                const ActiveIcon = NAV_ITEMS.find((n) => n.id === activeView)!.Icon;
                return <ActiveIcon size={18} className="text-blue-600" />;
              })()}
            <span className="font-semibold text-slate-800">
              {NAV_ITEMS.find((n) => n.id === activeView)?.label}
            </span>
          </div>
          <span className="ml-auto text-sm text-slate-400">{businessName}</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {activeView === "dashboard" && (
            <Dashboard stats={props.stats} config={props.config} />
          )}
          {activeView === "clientes" && (
            <ClientsView clients={props.clientRows} config={props.config} />
          )}
          {activeView === "servicios" && (
            <ServicesView services={props.serviceRows} config={props.config} />
          )}
          {activeView === "cotizaciones" && (
            <QuotesView
              quotes={props.quoteRows}
              clients={props.clientRows}
              services={props.serviceRows}
              quoteItemsByQuote={props.quoteItemsByQuote}
              config={props.config}
            />
          )}
          {activeView === "recibos" && (
            <ReceiptsView
              receipts={props.receiptRows}
              clients={props.clientRows}
              services={props.serviceRows}
              quotes={props.quoteRows}
              quoteItemsByQuote={props.quoteItemsByQuote}
              receiptItemsByReceipt={props.receiptItemsByReceipt}
              paymentsByReceipt={props.paymentsByReceipt}
              config={props.config}
            />
          )}
          {activeView === "config" && (
            <SettingsView config={props.config} />
          )}
        </div>
      </div>

      {/* ── NUEVO: FAB (botón flotante) abajo-derecha — solo móvil ──────── */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-6 right-6 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu size={24} />
      </button>

      {/* ── ELIMINADO: Barra de navegación inferior con 4 botones ────────── */}
    </div>
  );
}
