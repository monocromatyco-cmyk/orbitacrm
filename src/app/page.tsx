import { db } from "@/db";
import {
  clients,
  quoteItems,
  quotes,
  receiptItems,
  receiptPayments,
  receipts,
  services,
  settings,
} from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { CrmShell } from "@/components/crm-shell";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // ── Data fetching ──────────────────────────────────────────────────────────
  const [
    config,
    clientRows,
    serviceRows,
    quoteRows,
    receiptRows,
    quoteItemRows,
    receiptItemRows,
    paymentRows,
    clientCountRows,
    quoteCountRows,
    receiptCountRows,
    salesRows,
  ] = await Promise.all([
    db.select().from(settings).limit(1),
    db.select().from(clients).orderBy(desc(clients.createdAt)),
    db.select().from(services).orderBy(desc(services.createdAt)),
    db
      .select({
        id: quotes.id,
        quoteNumber: quotes.quoteNumber,
        title: quotes.title,
        status: quotes.status,
        currency: quotes.currency,
        applyTax: quotes.applyTax,
        taxRate: quotes.taxRate,
        subtotal: quotes.subtotal,
        taxAmount: quotes.taxAmount,
        total: quotes.total,
        validUntil: quotes.validUntil,
        notes: quotes.notes,
        createdAt: quotes.createdAt,
        clientId: quotes.clientId,
        clientName: sql<string | null>`(select full_name from clients where id = ${quotes.clientId})`,
      })
      .from(quotes)
      .orderBy(desc(quotes.createdAt)),
    db
      .select({
        id: receipts.id,
        receiptNumber: receipts.receiptNumber,
        currency: receipts.currency,
        applyTax: receipts.applyTax,
        taxRate: receipts.taxRate,
        subtotal: receipts.subtotal,
        taxAmount: receipts.taxAmount,
        total: receipts.total,
        paidAmount: receipts.paidAmount,
        balance: receipts.balance,
        paymentMethod: receipts.paymentMethod,
        status: receipts.status,
        notes: receipts.notes,
        issuedAt: receipts.issuedAt,
        createdAt: receipts.createdAt,
        clientId: receipts.clientId,
        quoteId: receipts.quoteId,
        clientName: sql<string | null>`(select full_name from clients where id = ${receipts.clientId})`,
      })
      .from(receipts)
      .orderBy(desc(receipts.createdAt)),
    db.select().from(quoteItems).orderBy(quoteItems.quoteId, quoteItems.id),
    db.select().from(receiptItems).orderBy(receiptItems.receiptId, receiptItems.id),
    db.select().from(receiptPayments).orderBy(receiptPayments.receiptId, receiptPayments.id),
    db.select({ total: sql<string>`count(*)::text` }).from(clients),
    db.select({ total: sql<string>`count(*)::text` }).from(quotes),
    db.select({ total: sql<string>`count(*)::text` }).from(receipts),
    db.select({ total: sql<string>`coalesce(sum(total), 0)::text` }).from(receipts).where(eq(receipts.status, "pagado")),
  ]);

  const appConfig = config[0] ?? {
    id: 0,
    businessName: "Órbita CRM",
    logoUrl: null,
    phone: null,
    email: null,
    address: null,
    currency: "MXN",
    defaultTaxRate: "16.00",
    bankName: null,
    bankAccount: null,
    bankClabe: null,
    bankBeneficiary: null,
    qrPayload: null,
    updatedAt: new Date(),
  };

  // Build lookup maps
  const quoteItemsByQuote = new Map<number, typeof quoteItemRows>();
  for (const item of quoteItemRows) {
    const arr = quoteItemsByQuote.get(item.quoteId) ?? [];
    arr.push(item);
    quoteItemsByQuote.set(item.quoteId, arr);
  }

  const receiptItemsByReceipt = new Map<number, typeof receiptItemRows>();
  for (const item of receiptItemRows) {
    const arr = receiptItemsByReceipt.get(item.receiptId) ?? [];
    arr.push(item);
    receiptItemsByReceipt.set(item.receiptId, arr);
  }

  const paymentsByReceipt = new Map<number, typeof paymentRows>();
  for (const p of paymentRows) {
    const arr = paymentsByReceipt.get(p.receiptId) ?? [];
    arr.push(p);
    paymentsByReceipt.set(p.receiptId, arr);
  }

  const stats = {
    clients: Number(clientCountRows[0]?.total ?? 0),
    quotes: Number(quoteCountRows[0]?.total ?? 0),
    receipts: Number(receiptCountRows[0]?.total ?? 0),
    sales: Number(salesRows[0]?.total ?? 0),
  };

  return (
    <CrmShell
      config={appConfig}
      clientRows={clientRows}
      serviceRows={serviceRows}
      quoteRows={quoteRows}
      receiptRows={receiptRows}
      quoteItemsByQuote={quoteItemsByQuote}
      receiptItemsByReceipt={receiptItemsByReceipt}
      paymentsByReceipt={paymentsByReceipt}
      stats={stats}
    />
  );
}
