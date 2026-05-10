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

// ââ Type exports used across views ââââââââââââââââââââââââââââââââââââââââââââ
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
  { id: "config", label: "ConfiguraciÃ³n", Icon: Settings },
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

  const businessName = props.config.businessName || "Ãrbita CRM";
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

      {/* ââ Sidebar ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */}
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
            <p className="text-[11px] text-blue-300/70">Ãrbita CRM</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto text-blue-400 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`
                flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                ${
                  activeView === item.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-blue-200/80 hover:bg-blue-900/40 hover:text-white"
                }
              `}
            >
              <item.Icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-blue-900/50">
          <p className="text-[11px] text-blue-400/60">{props.config.currency} Â· IVA {props.config.defaultTaxRate}%</p>
        </div>
      </aside>

      {/* ââ Main area ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 lg:px-6 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <Menu size={20} />
          </button>
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
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
            <span className="hidden sm:block">{businessName}</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {activeView === "dashboard" && (
            <Dashboard
              stats={props.stats}
              config={props.config}
              receiptRows={props.receiptRows}
              quoteRows={props.quoteRows}
              onNavigate={navigate}
            />
          )}
          {activeView === "clientes" && (
            <ClientsView clientRows={props.clientRows} />
          )}
          {activeView === "servicios" && (
            <ServicesView serviceRows={props.serviceRows} config={props.config} />
          )}
          {activeView === "cotizaciones" && (
            <QuotesView
              quoteRows={props.quoteRows}
              quoteItemsByQuote={props.quoteItemsByQuote}
              clientRows={props.clientRows}
              serviceRows={props.serviceRows}
              config={props.config}
            />
          )}
          {activeView === "recibos" && (
            <ReceiptsView
              receiptRows={props.receiptRows}
              receiptItemsByReceipt={props.receiptItemsByReceipt}
              paymentsByReceipt={props.paymentsByReceipt}
              clientRows={props.clientRows}
              serviceRows={props.serviceRows}
              quoteRows={props.quoteRows}
              config={props.config}
            />
          )}
          {activeView === "config" && (
            <SettingsView config={props.config} />
          )}
        </main>
      </div>

      {/* ── FAB: botón de menú abajo-derecha (solo móvil) ──────────────── */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-6 right-6 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu size={24} />
      </button>
    </div>
  );
}
