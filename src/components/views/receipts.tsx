"use client";
import { useState } from "react";
import type { AppConfig, Client, Payment, Quote, Receipt, ReceiptItem, Service } from "@/components/crm-shell";
import { Modal } from "@/components/ui/modal";
import { statusBadge } from "@/components/ui/badge";
import { money, n, dt } from "@/lib/fmt";
import {
  createReceipt,
  updateReceipt,
  deleteReceipt,
  addReceiptItem,
  deleteReceiptItem,
  addReceiptPayment,
  deleteReceiptPayment,
} from "@/app/actions";
import { Search, Plus, Pencil, Printer, Trash2, ChevronUp, ChevronDown, X, Banknote } from "@/components/icons";

type Props = {
  receiptRows: Receipt[];
  receiptItemsByReceipt: Map<number, ReceiptItem[]>;
  paymentsByReceipt: Map<number, Payment[]>;
  clientRows: Client[];
  serviceRows: Service[];
  quoteRows: Quote[];
  config: AppConfig;
};

export function ReceiptsView({
  receiptRows,
  receiptItemsByReceipt,
  paymentsByReceipt,
  clientRows,
  serviceRows,
  quoteRows,
  config,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Receipt | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showAddItem, setShowAddItem] = useState<number | null>(null);
  const [showAddPayment, setShowAddPayment] = useState<number | null>(null);

  const filtered = receiptRows.filter((r) => {
    const qStr = search.toLowerCase();
    const matchSearch =
      !search ||
      (r.receiptNumber ?? "").toLowerCase().includes(qStr) ||
      (r.clientName ?? "").toLowerCase().includes(qStr);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
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
            placeholder="Buscar recibos…"
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
          <option value="pendiente">Pendiente</option>
          <option value="parcial">Parcial</option>
          <option value="pagado">Pagado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <button
          onClick={() => setShowAdd(true)}
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
        >
          <Plus size={16} />
          Nuevo
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
          <p className="text-slate-400 text-sm">{search || statusFilter !== "all" ? "Sin resultados." : "No hay recibos todavía."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const items = receiptItemsByReceipt.get(r.id) ?? [];
            const payments = paymentsByReceipt.get(r.id) ?? [];
            const isExpanded = expanded === r.id;

            return (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                {/* Header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpanded(isExpanded ? null : r.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-700 text-sm">
                        {r.receiptNumber ?? `REC-${r.id}`}
                      </span>
                      <span className="text-slate-300 text-sm">·</span>
                      <span className="text-sm text-slate-700 truncate">{r.clientName || "sin cliente"}</span>
                      {statusBadge(r.status)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span>{dt(r.createdAt)}</span>
                      <span>·</span>
                      <span>{r.paymentMethod}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-800">{money(n(r.total), r.currency)}</p>
                    {n(r.balance) > 0 && (
                      <p className="text-xs text-amber-600">Saldo: {money(n(r.balance), r.currency)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`/imprimir/recibo/${r.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                      title="Imprimir"
                    >
                      <Printer size={14} />
                    </a>
                    <button
                      onClick={() => setEditing(r)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                    >
                      <Pencil size={14} />
                    </button>
                    <form action={async (fd) => { await deleteReceipt(fd); }}>
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </form>
                  </div>
                  {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 py-3 space-y-4">
                    {/* Items */}
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Conceptos</p>
                      {items.length === 0 ? (
                        <p className="text-sm text-slate-400">Sin conceptos.</p>
                      ) : (
                        <table className="w-full text-sm mb-2">
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
                                <td className="py-1.5 text-right text-slate-500">{money(n(item.unitPrice), r.currency)}</td>
                                <td className="py-1.5 text-right font-medium text-slate-700">{money(n(item.lineTotal), r.currency)}</td>
                                <td className="py-1.5 pl-2">
                                  <form action={async (fd) => { await deleteReceiptItem(fd); }}>
                                    <input type="hidden" name="id" value={item.id} />
                                    <input type="hidden" name="receiptId" value={r.id} />
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
                      <button
                        onClick={() => setShowAddItem(r.id)}
                        className="rounded-xl border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                      >
                        <Plus size={12} />
                        Agregar concepto
                      </button>
                    </div>

                    {/* Payments */}
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Abonos</p>
                      {payments.length === 0 ? (
                        <p className="text-sm text-slate-400">Sin abonos.</p>
                      ) : (
                        <div className="space-y-1.5 mb-2">
                          {payments.map((p) => (
                            <div key={p.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-slate-600">
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{p.method}</span>
                                <span className="text-xs text-slate-400">{dt(p.paidAt)}</span>
                                {p.note && <span className="text-xs text-slate-400">{p.note}</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-emerald-600">{money(n(p.amount), r.currency)}</span>
                                <form action={async (fd) => { await deleteReceiptPayment(fd); }}>
                                  <input type="hidden" name="id" value={p.id} />
                                  <input type="hidden" name="receiptId" value={r.id} />
                                  <button type="submit" className="text-slate-300 hover:text-red-400">
                                    <X size={12} />
                                  </button>
                                </form>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => setShowAddPayment(r.id)}
                        className="rounded-xl border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors inline-flex items-center gap-1"
                      >
                        <Banknote size={12} />
                        Registrar abono
                      </button>
                    </div>

                    {/* Totals */}
                    <div className="border-t border-slate-100 pt-3 space-y-1 text-sm">
                      <div className="flex justify-between text-slate-500">
                        <span>Subtotal</span><span>{money(n(r.subtotal), r.currency)}</span>
                      </div>
                      {r.applyTax && (
                        <div className="flex justify-between text-slate-500">
                          <span>IVA ({n(r.taxRate)}%)</span><span>{money(n(r.taxAmount), r.currency)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Total</span><span>{money(n(r.total), r.currency)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Abonado</span><span>{money(n(r.paidAmount), r.currency)}</span>
                      </div>
                      {n(r.balance) > 0 && (
                        <div className="flex justify-between text-amber-600 font-semibold">
                          <span>Saldo pendiente</span><span>{money(n(r.balance), r.currency)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Receipt */}
      {showAdd && (
        <Modal title="Nuevo recibo" onClose={() => setShowAdd(false)}>
          <form
            action={async (fd) => {
              await createReceipt(fd);
              setShowAdd(false);
            }}
            className="space-y-3"
          >
            <ReceiptFields clients={clientRows} quotes={quoteRows} config={config} />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Crear</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Receipt */}
      {editing && (
        <Modal title="Editar recibo" onClose={() => setEditing(null)}>
          <form
            action={async (fd) => {
              fd.append("id", String(editing.id));
              await updateReceipt(fd);
              setEditing(null);
            }}
            className="space-y-3"
          >
            <ReceiptFields clients={clientRows} quotes={quoteRows} config={config} defaults={editing} />
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
              await addReceiptItem(fd);
              setShowAddItem(null);
            }}
            className="space-y-3"
          >
            <input type="hidden" name="receiptId" value={showAddItem} />
            <ReceiptItemFields services={serviceRows} />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddItem(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Agregar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Payment */}
      {showAddPayment !== null && (
        <Modal title="Registrar abono" onClose={() => setShowAddPayment(null)}>
          <form
            action={async (fd) => {
              await addReceiptPayment(fd);
              setShowAddPayment(null);
            }}
            className="space-y-3"
          >
            <input type="hidden" name="receiptId" value={showAddPayment} />
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Monto</label>
              <input type="number" name="amount" step="0.01" min="0.01" required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Método de pago</label>
              <select name="method"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400">
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="cheque">Cheque</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Nota (opcional)</label>
              <input type="text" name="note"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddPayment(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">Registrar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function ReceiptFields({
  clients,
  quotes,
  config,
  defaults,
}: {
  clients: Client[];
  quotes: Quote[];
  config: AppConfig;
  defaults?: Receipt;
}) {
  return (
    <>
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
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Cotización relacionada</label>
        <select name="quoteId" defaultValue={defaults?.quoteId ?? ""}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400">
          <option value="">— Sin cotización —</option>
          {quotes.map((q) => (
            <option key={q.id} value={q.id}>{q.quoteNumber ?? `COT-${q.id}`} · {q.title}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Moneda</label>
          <input type="text" name="currency" defaultValue={defaults?.currency ?? config.currency}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Método de pago</label>
          <select name="paymentMethod" defaultValue={defaults?.paymentMethod ?? "transferencia"}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400">
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="cheque">Cheque</option>
            <option value="mixto">Mixto</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Tasa IVA (%)</label>
        <input type="number" name="taxRate" defaultValue={defaults?.taxRate ?? config.defaultTaxRate} step="0.01"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" name="applyTax" id="applyTax-r" defaultChecked={defaults?.applyTax ?? false}
          className="rounded border-slate-300 text-blue-600" />
        <label htmlFor="applyTax-r" className="text-sm text-slate-600">Aplicar IVA</label>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Notas</label>
        <textarea name="notes" defaultValue={defaults?.notes ?? ""} rows={2}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none" />
      </div>
    </>
  );
}

function ReceiptItemFields({ services }: { services: Service[] }) {
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
