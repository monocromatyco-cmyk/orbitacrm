"use client";
import { useState } from "react";
import type { AppConfig, Client, Quote, QuoteItem, Service } from "@/components/crm-shell";
import { Modal } from "@/components/ui/modal";
import { statusBadge } from "@/components/ui/badge";
import { money, n, dt } from "@/lib/fmt";
import {
  createQuote,
  updateQuote,
  deleteQuote,
  addQuoteItem,
  deleteQuoteItem,
} from "@/app/actions";
import { Search, Plus, Pencil, Printer, Trash2, ChevronUp, ChevronDown, X } from "@/components/icons";

type Props = {
  quoteRows: Quote[];
  quoteItemsByQuote: Map<number, QuoteItem[]>;
  clientRows: Client[];
  serviceRows: Service[];
  config: AppConfig;
};

export function QuotesView({ quoteRows, quoteItemsByQuote, clientRows, serviceRows, config }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Quote | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showAddItem, setShowAddItem] = useState<number | null>(null);

  const filtered = quoteRows.filter((q) => {
    const qStr = search.toLowerCase();
    const matchSearch =
      !search ||
      (q.quoteNumber ?? "").toLowerCase().includes(qStr) ||
      q.title.toLowerCase().includes(qStr) ||
      (q.clientName ?? "").toLowerCase().includes(qStr);
    const matchStatus = statusFilter === "all" || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-40">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar cotizaciones…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
        >
          <option value="all">Todos</option>
          <option value="draft">Borrador</option>
          <option value="sent">Enviada</option>
          <option value="accepted">Aceptada</option>
          <option value="rejected">Rechazada</option>
        </select>
        <button
          onClick={() => setShowAdd(true)}
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
        >
          <Plus size={16} />
          Nueva
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
          <p className="text-slate-400 text-sm">{search || statusFilter !== "all" ? "Sin resultados." : "No hay cotizaciones todavía."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => {
            const items = quoteItemsByQuote.get(q.id) ?? [];
            const isExpanded = expanded === q.id;
            return (
              <div key={q.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                {/* Header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpanded(isExpanded ? null : q.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-700 text-sm">
                        {q.quoteNumber ?? `COT-${q.id}`}
                      </span>
                      <span className="text-slate-300 text-sm">·</span>
                      <span className="text-sm text-slate-700 truncate">{q.title}</span>
                      {statusBadge(q.status)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span>{q.clientName || "sin cliente"}</span>
                      <span>·</span>
                      <span>{dt(q.createdAt)}</span>
                      {q.validUntil && <><span>·</span><span>Válida hasta {q.validUntil}</span></>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-800">{money(n(q.total), q.currency)}</p>
                    {q.applyTax && <p className="text-xs text-slate-400">IVA {n(q.taxRate)}%</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`/imprimir/cotizacion/${q.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                      title="Imprimir"
                    >
                      <Printer size={14} />
                    </a>
                    <button
                      onClick={() => setEditing(q)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                    >
                      <Pencil size={14} />
                    </button>
                    <form action={async (fd) => { await deleteQuote(fd); }}>
                      <input type="hidden" name="id" value={q.id} />
                      <button type="submit" className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </form>
                  </div>
                  {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                </div>

                {/* Items (expanded) */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 py-3">
                    {items.length === 0 ? (
                      <p className="text-sm text-slate-400 py-2">Sin conceptos.</p>
                    ) : (
                      <table className="w-full text-sm mb-3">
                        <thead>
                          <tr className="text-xs text-slate-400 border-b border-slate-100">
                            <th className="pb-1 text-left font-medium">Descripción</th>
                            <th className="pb-1 text-right font-medium">Cant.</th>
                            <th className="pb-1 text-right font-medium">Precio</th>
                            <th className="pb-1 text-right font-medium">Total</th>
                            <th className="pb-1 w-6" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {items.map((item) => (
                            <tr key={item.id}>
                              <td className="py-1.5 text-slate-700 pr-2">{item.description}</td>
                              <td className="py-1.5 text-right text-slate-500">{n(item.quantity)} {item.unit}</td>
                              <td className="py-1.5 text-right text-slate-500">{money(n(item.unitPrice), q.currency)}</td>
                              <td className="py-1.5 text-right font-medium text-slate-700">{money(n(item.lineTotal), q.currency)}</td>
                              <td className="py-1.5 pl-2">
                                <form action={async (fd) => { await deleteQuoteItem(fd); }}>
                                  <input type="hidden" name="id" value={item.id} />
                                  <input type="hidden" name="quoteId" value={q.id} />
                                  <button type="submit" className="text-slate-300 hover:text-red-400">
                                    <X size={12} />
                                  </button>
                                </form>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* Totals */}
                    <div className="border-t border-slate-100 pt-2 space-y-1 text-sm">
                      <div className="flex justify-between text-slate-500">
                        <span>Subtotal</span><span>{money(n(q.subtotal), q.currency)}</span>
                      </div>
                      {q.applyTax && (
                        <div className="flex justify-between text-slate-500">
                          <span>IVA ({n(q.taxRate)}%)</span><span>{money(n(q.taxAmount), q.currency)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Total</span><span>{money(n(q.total), q.currency)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowAddItem(q.id)}
                      className="mt-3 rounded-xl border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                    >
                      <Plus size={12} />
                      Agregar concepto
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Quote */}
      {showAdd && (
        <Modal title="Nueva cotización" onClose={() => setShowAdd(false)}>
          <form
            action={async (fd) => {
              await createQuote(fd);
              setShowAdd(false);
            }}
            className="space-y-3"
          >
            <QuoteFields clients={clientRows} config={config} />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Crear</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Quote */}
      {editing && (
        <Modal title="Editar cotización" onClose={() => setEditing(null)}>
          <form
            action={async (fd) => {
              fd.append("id", String(editing.id));
              await updateQuote(fd);
              setEditing(null);
            }}
            className="space-y-3"
          >
            <QuoteFields clients={clientRows} config={config} defaults={editing} />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Actualizar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Item */}
      {showAddItem !== null && (
        <Modal title="Agregar concepto" onClose={() => setShowAddItem(null)}>
          <form
            action={async (fd) => {
              await addQuoteItem(fd);
              setShowAddItem(null);
            }}
            className="space-y-3"
          >
            <input type="hidden" name="quoteId" value={showAddItem} />
            <QuoteItemFields services={serviceRows} />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddItem(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Agregar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function QuoteFields({
  clients,
  config,
  defaults,
}: {
  clients: Client[];
  config: AppConfig;
  defaults?: Quote;
}) {
  return (
    <>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Título *</label>
        <input type="text" name="title" defaultValue={defaults?.title} required
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Cliente</label>
        <select name="clientId" defaultValue={defaults?.clientId ?? ""}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400">
          <option value="">— Sin cliente —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.companyName || c.fullName}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Estado</label>
          <select name="status" defaultValue={defaults?.status ?? "draft"}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400">
            <option value="draft">Borrador</option>
            <option value="sent">Enviada</option>
            <option value="accepted">Aceptada</option>
            <option value="rejected">Rechazada</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Moneda</label>
          <input type="text" name="currency" defaultValue={defaults?.currency ?? config.currency}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Válida hasta</label>
          <input type="date" name="validUntil" defaultValue={defaults?.validUntil ?? ""}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Tasa IVA (%)</label>
          <input type="number" name="taxRate" defaultValue={defaults?.taxRate ?? config.defaultTaxRate} step="0.01"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" name="applyTax" id="applyTax-q" defaultChecked={defaults?.applyTax ?? false}
          className="rounded border-slate-300 text-blue-600" />
        <label htmlFor="applyTax-q" className="text-sm text-slate-600">Aplicar IVA</label>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Notas</label>
        <textarea name="notes" defaultValue={defaults?.notes ?? ""} rows={2}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none" />
      </div>
    </>
  );
}

function QuoteItemFields({ services }: { services: Service[] }) {
  return (
    <>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Servicio (opcional)</label>
        <select name="serviceId"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400">
          <option value="">— Descripción libre —</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Descripción</label>
        <input type="text" name="description"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Cantidad</label>
          <input type="number" name="quantity" defaultValue="1" step="0.01" min="0"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Unidad</label>
          <input type="text" name="unit" defaultValue="pza"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Precio unit.</label>
          <input type="number" name="unitPrice" defaultValue="0" step="0.01" min="0"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
        </div>
      </div>
    </>
  );
}
