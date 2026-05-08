import { db } from "@/db";
import { clients, receiptItems, receiptPayments, receipts, settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { money, n, dt } from "@/lib/fmt";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function PrintReceiptPage({ params }: Props) {
  const { id } = await params;
  const receiptId = Number.parseInt(id, 10);
  if (!Number.isFinite(receiptId)) notFound();

  const [receipt] = await db.select().from(receipts).where(eq(receipts.id, receiptId)).limit(1);
  if (!receipt) notFound();

  const [config] = await db.select().from(settings).limit(1);
  const client = receipt.clientId
    ? (await db.select().from(clients).where(eq(clients.id, receipt.clientId)).limit(1))[0]
    : null;
  const items = await db.select().from(receiptItems).where(eq(receiptItems.receiptId, receiptId));
  const payments = await db.select().from(receiptPayments).where(eq(receiptPayments.receiptId, receiptId));

  const businessName = config?.businessName ?? "Mi Empresa";
  const cur = receipt.currency;

  const statusLabel: Record<string, string> = {
    pendiente: "Pendiente",
    parcial: "Pago Parcial",
    pagado: "Pagado",
    cancelado: "Cancelado",
  };

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Recibo {receipt.receiptNumber ?? `REC-${receipt.id}`}</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #1e293b; background: white; }
          .page { max-width: 780px; margin: 0 auto; padding: 40px 32px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #2563eb; }
          .logo-area h1 { font-size: 22px; font-weight: 700; color: #1e293b; }
          .logo-area p { font-size: 11px; color: #64748b; margin-top: 2px; }
          .doc-info { text-align: right; }
          .doc-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
          .doc-number { font-size: 20px; font-weight: 700; color: #2563eb; margin-top: 2px; }
          .doc-meta { font-size: 11px; color: #64748b; margin-top: 4px; }
          .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
          .party { background: #f8fafc; border-radius: 8px; padding: 16px; border-left: 3px solid #2563eb; }
          .party .label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 6px; }
          .party .name { font-size: 14px; font-weight: 600; color: #1e293b; }
          .party .detail { font-size: 11px; color: #64748b; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          thead th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #2563eb; border-bottom: 2px solid #2563eb; background: white; }
          thead th:last-child { text-align: right; }
          tbody tr { border-bottom: 1px solid #e2e8f0; }
          tbody tr:nth-child(even) { background: #f8fafc; }
          tbody td { padding: 10px 12px; font-size: 12px; }
          tbody td:last-child { text-align: right; font-weight: 600; }
          .section-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin: 24px 0 10px; }
          .totals { margin-left: auto; width: 280px; }
          .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; }
          .totals .row.total { font-size: 16px; font-weight: 700; color: #1e293b; border-bottom: none; padding-top: 10px; border-top: 2px solid #2563eb; margin-top: 4px; }
          .totals .row.paid { color: #059669; font-weight: 600; }
          .totals .row.balance { color: #d97706; font-weight: 700; font-size: 14px; }
          .payments-list { margin-bottom: 16px; }
          .payment-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8fafc; border-radius: 6px; margin-bottom: 6px; border-left: 3px solid #93c5fd; }
          .payment-row .method { font-size: 11px; font-weight: 600; color: #2563eb; background: #dbeafe; padding: 2px 8px; border-radius: 999px; }
          .payment-row .date { font-size: 11px; color: #64748b; }
          .payment-row .amount { font-size: 13px; font-weight: 700; color: #1e293b; }
          .notes { margin-top: 28px; padding: 16px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #93c5fd; }
          .notes .label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 6px; }
          .notes p { font-size: 12px; color: #475569; }
          .bank-info { margin-top: 24px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; }
          .bank-info .label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 8px; }
          .bank-info .row { display: flex; justify-content: space-between; font-size: 11px; padding: 3px 0; }
          .bank-info .row span:first-child { color: #64748b; }
          .bank-info .row span:last-child { font-weight: 600; color: #1e293b; }
          .status-badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 6px; }
          .status-pagado { background: #d1fae5; color: #065f46; }
          .status-pendiente { background: #fef3c7; color: #92400e; }
          .status-parcial { background: #dbeafe; color: #1e40af; }
          .status-cancelado { background: #fee2e2; color: #991b1b; }
          .print-btn { position: fixed; bottom: 24px; right: 24px; padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 14px rgba(37,99,235,0.3); display: flex; align-items: center; gap: 8px; }
          .print-btn:hover { background: #1d4ed8; }
          .print-btn svg { width: 18px; height: 18px; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8; }
          @media print {
            .print-btn { display: none; }
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        `}</style>
      </head>
      <body>
        <div className="page">
          {/* Header */}
          <div className="header">
            <div className="logo-area">
              {config?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={config.logoUrl} alt="Logo" style={{ height: 48, marginBottom: 8 }} />
              ) : (
                <h1>{businessName}</h1>
              )}
              {config?.phone && <p>Tel: {config.phone}</p>}
              {config?.email && <p>{config.email}</p>}
              {config?.address && <p>{config.address}</p>}
            </div>
            <div className="doc-info">
              <div className="doc-label">Recibo de Venta</div>
              <div className="doc-number">
                {receipt.receiptNumber ?? `REC-${receipt.id}`}
              </div>
              <div className="doc-meta">Fecha: {dt(receipt.issuedAt)}</div>
              <div className="doc-meta">Método: {receipt.paymentMethod}</div>
              <div>
                <span className={`status-badge status-${receipt.status}`}>
                  {statusLabel[receipt.status] ?? receipt.status}
                </span>
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="parties">
            <div className="party">
              <div className="label">Emisor</div>
              <div className="name">{businessName}</div>
              {config?.phone && <div className="detail">Tel: {config.phone}</div>}
              {config?.email && <div className="detail">{config.email}</div>}
            </div>
            <div className="party">
              <div className="label">Cliente</div>
              {client ? (
                <>
                  <div className="name">{client.companyName || client.fullName}</div>
                  {client.companyName && <div className="detail">{client.representativeName || client.fullName}</div>}
                  {client.phone && <div className="detail">Tel: {client.phone}</div>}
                  {client.email && <div className="detail">{client.email}</div>}
                  {client.address && <div className="detail">{client.address}</div>}
                </>
              ) : (
                <div className="detail">Sin cliente asignado</div>
              )}
            </div>
          </div>

          {/* Items */}
          <p className="section-title">Conceptos</p>
          <table>
            <thead>
              <tr>
                <th style={{ width: "40%" }}>Descripción</th>
                <th style={{ textAlign: "right" }}>Cant.</th>
                <th style={{ textAlign: "right" }}>Unidad</th>
                <th style={{ textAlign: "right" }}>Precio unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.description}</td>
                  <td style={{ textAlign: "right" }}>{n(item.quantity)}</td>
                  <td style={{ textAlign: "right" }}>{item.unit}</td>
                  <td style={{ textAlign: "right" }}>{money(n(item.unitPrice), cur)}</td>
                  <td>{money(n(item.lineTotal), cur)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="totals">
            <div className="row">
              <span>Subtotal</span>
              <span>{money(n(receipt.subtotal), cur)}</span>
            </div>
            {receipt.applyTax && (
              <div className="row">
                <span>IVA ({n(receipt.taxRate)}%)</span>
                <span>{money(n(receipt.taxAmount), cur)}</span>
              </div>
            )}
            <div className="row total">
              <span>Total</span>
              <span>{money(n(receipt.total), cur)}</span>
            </div>
            <div className="row paid">
              <span>Abonado</span>
              <span>{money(n(receipt.paidAmount), cur)}</span>
            </div>
            {n(receipt.balance) > 0 && (
              <div className="row balance">
                <span>Saldo pendiente</span>
                <span>{money(n(receipt.balance), cur)}</span>
              </div>
            )}
          </div>

          {/* Payments */}
          {payments.length > 0 && (
            <>
              <p className="section-title" style={{ marginTop: 28 }}>Historial de abonos</p>
              <div className="payments-list">
                {payments.map((p) => (
                  <div key={p.id} className="payment-row">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="method">{p.method}</span>
                      <span className="date">{dt(p.paidAt)}</span>
                      {p.note && <span className="date">· {p.note}</span>}
                    </div>
                    <span className="amount">{money(n(p.amount), cur)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Notes */}
          {receipt.notes && (
            <div className="notes">
              <div className="label">Notas</div>
              <p>{receipt.notes}</p>
            </div>
          )}

          {/* Bank info */}
          {(config?.bankName || config?.bankAccount) && (
            <div className="bank-info">
              <div className="label">Datos bancarios para pago</div>
              {config.bankName && (
                <div className="row"><span>Banco</span><span>{config.bankName}</span></div>
              )}
              {config.bankBeneficiary && (
                <div className="row"><span>Beneficiario</span><span>{config.bankBeneficiary}</span></div>
              )}
              {config.bankAccount && (
                <div className="row"><span>Cuenta</span><span>{config.bankAccount}</span></div>
              )}
              {config.bankClabe && (
                <div className="row"><span>CLABE</span><span>{config.bankClabe}</span></div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="footer">
            <p>{businessName} · Recibo generado por Órbita CRM</p>
          </div>
        </div>

        <button className="print-btn" id="print-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Imprimir / PDF
        </button>
        <script dangerouslySetInnerHTML={{ __html: "document.getElementById('print-btn').onclick=()=>window.print();" }} />
      </body>
    </html>
  );
}
