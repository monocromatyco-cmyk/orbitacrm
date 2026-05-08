"use server";
import { revalidatePath } from "next/cache";
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
import { eq, sql } from "drizzle-orm";

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return "";
  return value.trim();
}

function optionalText(formData: FormData, key: string) {
  const value = textValue(formData, key);
  return value.length > 0 ? value : null;
}

function toNumber(value: string, fallback = 0) {
  const normalized = Number.parseFloat(value);
  if (!Number.isFinite(normalized)) return fallback;
  return normalized;
}

function toMoney(value: number) {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toFixed(2);
}

function toMoneyFromString(value: string) {
  return toMoney(toNumber(value, 0));
}

function optionalInt(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function checkboxValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

function formatSequence(prefix: string, id: number) {
  return `${prefix}-${String(id).padStart(4, "0")}`;
}

async function recalculateQuote(quoteId: number) {
  const subtotalRow = await db
    .select({ value: sql<string>`coalesce(sum(${quoteItems.lineTotal}), 0)::text` })
    .from(quoteItems)
    .where(eq(quoteItems.quoteId, quoteId));

  const quoteRow = await db
    .select({ applyTax: quotes.applyTax, taxRate: quotes.taxRate })
    .from(quotes)
    .where(eq(quotes.id, quoteId))
    .limit(1);

  const subtotal = toNumber(subtotalRow[0]?.value ?? "0");
  const applyTax = quoteRow[0]?.applyTax ?? false;
  const taxRate = toNumber(String(quoteRow[0]?.taxRate ?? "16"), 16);
  const taxAmount = applyTax ? subtotal * (taxRate / 100) : 0;
  const total = subtotal + taxAmount;

  await db
    .update(quotes)
    .set({
      subtotal: toMoney(subtotal),
      taxAmount: toMoney(taxAmount),
      total: toMoney(total),
    })
    .where(eq(quotes.id, quoteId));
}

async function recalculateReceipt(receiptId: number) {
  const subtotalRow = await db
    .select({ value: sql<string>`coalesce(sum(${receiptItems.lineTotal}), 0)::text` })
    .from(receiptItems)
    .where(eq(receiptItems.receiptId, receiptId));

  const paidRow = await db
    .select({ value: sql<string>`coalesce(sum(${receiptPayments.amount}), 0)::text` })
    .from(receiptPayments)
    .where(eq(receiptPayments.receiptId, receiptId));

  const receiptRow = await db
    .select({ applyTax: receipts.applyTax, taxRate: receipts.taxRate })
    .from(receipts)
    .where(eq(receipts.id, receiptId))
    .limit(1);

  const subtotal = toNumber(subtotalRow[0]?.value ?? "0");
  const paid = toNumber(paidRow[0]?.value ?? "0");
  const applyTax = receiptRow[0]?.applyTax ?? false;
  const taxRate = toNumber(String(receiptRow[0]?.taxRate ?? "16"), 16);
  const taxAmount = applyTax ? subtotal * (taxRate / 100) : 0;
  const total = subtotal + taxAmount;
  const balance = Math.max(total - paid, 0);

  let status = "pendiente";
  if (paid > 0 && paid < total) status = "parcial";
  if (paid >= total && total > 0) status = "pagado";

  await db
    .update(receipts)
    .set({
      subtotal: toMoney(subtotal),
      taxAmount: toMoney(taxAmount),
      total: toMoney(total),
      paidAmount: toMoney(paid),
      balance: toMoney(balance),
      status,
    })
    .where(eq(receipts.id, receiptId));
}

export async function saveSettings(formData: FormData) {
  const payload = {
    businessName: textValue(formData, "businessName") || "Mi Taller",
    logoUrl: optionalText(formData, "logoUrl"),
    phone: optionalText(formData, "phone"),
    email: optionalText(formData, "email"),
    address: optionalText(formData, "address"),
    currency: textValue(formData, "currency") || "MXN",
    defaultTaxRate: toMoneyFromString(textValue(formData, "defaultTaxRate") || "16"),
    bankName: optionalText(formData, "bankName"),
    bankAccount: optionalText(formData, "bankAccount"),
    bankClabe: optionalText(formData, "bankClabe"),
    bankBeneficiary: optionalText(formData, "bankBeneficiary"),
    qrPayload: optionalText(formData, "qrPayload"),
    updatedAt: new Date(),
  };

  const current = await db.select({ id: settings.id }).from(settings).limit(1);
  if (current[0]) {
    await db.update(settings).set(payload).where(eq(settings.id, current[0].id));
  } else {
    await db.insert(settings).values(payload);
  }
  revalidatePath("/");
}

export async function createClient(formData: FormData) {
  const fullName = textValue(formData, "fullName");
  if (!fullName) return;
  await db.insert(clients).values({
    fullName,
    companyName: optionalText(formData, "companyName"),
    representativeName: optionalText(formData, "representativeName"),
    role: optionalText(formData, "role"),
    phone: optionalText(formData, "phone"),
    email: optionalText(formData, "email"),
    address: optionalText(formData, "address"),
    notes: optionalText(formData, "notes"),
  });
  revalidatePath("/");
}

export async function updateClient(formData: FormData) {
  const id = optionalInt(textValue(formData, "id"));
  if (!id) return;
  const fullName = textValue(formData, "fullName");
  if (!fullName) return;
  await db
    .update(clients)
    .set({
      fullName,
      companyName: optionalText(formData, "companyName"),
      representativeName: optionalText(formData, "representativeName"),
      role: optionalText(formData, "role"),
      phone: optionalText(formData, "phone"),
      email: optionalText(formData, "email"),
      address: optionalText(formData, "address"),
      notes: optionalText(formData, "notes"),
    })
    .where(eq(clients.id, id));
  revalidatePath("/");
}

export async function createService(formData: FormData) {
  const name = textValue(formData, "name");
  if (!name) return;
  await db.insert(services).values({
    name,
    description: optionalText(formData, "description"),
    unit: textValue(formData, "unit") || "pza",
    basePrice: toMoneyFromString(textValue(formData, "basePrice")),
  });
  revalidatePath("/");
}

export async function updateService(formData: FormData) {
  const id = optionalInt(textValue(formData, "id"));
  if (!id) return;
  const name = textValue(formData, "name");
  if (!name) return;
  await db
    .update(services)
    .set({
      name,
      description: optionalText(formData, "description"),
      unit: textValue(formData, "unit") || "pza",
      basePrice: toMoneyFromString(textValue(formData, "basePrice")),
    })
    .where(eq(services.id, id));
  revalidatePath("/");
}

export async function createQuote(formData: FormData) {
  const title = textValue(formData, "title");
  if (!title) return;
  const created = await db
    .insert(quotes)
    .values({
      title,
      status: textValue(formData, "status") || "draft",
      clientId: optionalInt(textValue(formData, "clientId")),
      validUntil: optionalText(formData, "validUntil"),
      notes: optionalText(formData, "notes"),
      currency: textValue(formData, "currency") || "MXN",
      applyTax: checkboxValue(formData, "applyTax"),
      taxRate: toMoneyFromString(textValue(formData, "taxRate") || "16"),
    })
    .returning({ id: quotes.id });
  const quoteId = created[0]?.id;
  if (quoteId) {
    await db
      .update(quotes)
      .set({ quoteNumber: formatSequence("COT", quoteId) })
      .where(eq(quotes.id, quoteId));
    await recalculateQuote(quoteId);
  }
  revalidatePath("/");
}

export async function updateQuote(formData: FormData) {
  const id = optionalInt(textValue(formData, "id"));
  if (!id) return;
  const title = textValue(formData, "title");
  if (!title) return;
  await db
    .update(quotes)
    .set({
      title,
      status: textValue(formData, "status") || "draft",
      clientId: optionalInt(textValue(formData, "clientId")),
      validUntil: optionalText(formData, "validUntil"),
      notes: optionalText(formData, "notes"),
      currency: textValue(formData, "currency") || "MXN",
      applyTax: checkboxValue(formData, "applyTax"),
      taxRate: toMoneyFromString(textValue(formData, "taxRate") || "16"),
    })
    .where(eq(quotes.id, id));
  await recalculateQuote(id);
  revalidatePath("/");
}

export async function updateQuoteTax(formData: FormData) {
  const quoteId = optionalInt(textValue(formData, "quoteId"));
  if (!quoteId) return;
  await db
    .update(quotes)
    .set({
      applyTax: checkboxValue(formData, "applyTax"),
      taxRate: toMoneyFromString(textValue(formData, "taxRate") || "16"),
    })
    .where(eq(quotes.id, quoteId));
  await recalculateQuote(quoteId);
  revalidatePath("/");
}

export async function addQuoteItem(formData: FormData) {
  const quoteId = optionalInt(textValue(formData, "quoteId"));
  if (!quoteId) return;
  const serviceId = optionalInt(textValue(formData, "serviceId"));
  const service = serviceId
    ? (
        await db
          .select({ id: services.id, name: services.name, unit: services.unit, basePrice: services.basePrice })
          .from(services)
          .where(eq(services.id, serviceId))
          .limit(1)
      )[0]
    : null;
  const quantity = toNumber(textValue(formData, "quantity"), 1);
  const unitPrice = toNumber(
    textValue(formData, "unitPrice"),
    service ? toNumber(String(service.basePrice), 0) : 0
  );
  const description = textValue(formData, "description") || service?.name || "Concepto sin descripción";
  const unit = textValue(formData, "unit") || service?.unit || "pza";
  const lineTotal = quantity * unitPrice;
  await db.insert(quoteItems).values({
    quoteId,
    serviceId,
    description,
    quantity: toMoney(quantity),
    unit,
    unitPrice: toMoney(unitPrice),
    lineTotal: toMoney(lineTotal),
  });
  await recalculateQuote(quoteId);
  revalidatePath("/");
}

export async function createReceipt(formData: FormData) {
  const created = await db
    .insert(receipts)
    .values({
      clientId: optionalInt(textValue(formData, "clientId")),
      quoteId: optionalInt(textValue(formData, "quoteId")),
      notes: optionalText(formData, "notes"),
      currency: textValue(formData, "currency") || "MXN",
      applyTax: checkboxValue(formData, "applyTax"),
      taxRate: toMoneyFromString(textValue(formData, "taxRate") || "16"),
      paymentMethod: textValue(formData, "paymentMethod") || "transferencia",
    })
    .returning({ id: receipts.id });
  const receiptId = created[0]?.id;
  if (receiptId) {
    await db
      .update(receipts)
      .set({ receiptNumber: formatSequence("REC", receiptId) })
      .where(eq(receipts.id, receiptId));
    await recalculateReceipt(receiptId);
  }
  revalidatePath("/");
}

export async function updateReceipt(formData: FormData) {
  const id = optionalInt(textValue(formData, "id"));
  if (!id) return;
  await db
    .update(receipts)
    .set({
      clientId: optionalInt(textValue(formData, "clientId")),
      quoteId: optionalInt(textValue(formData, "quoteId")),
      notes: optionalText(formData, "notes"),
      currency: textValue(formData, "currency") || "MXN",
      applyTax: checkboxValue(formData, "applyTax"),
      taxRate: toMoneyFromString(textValue(formData, "taxRate") || "16"),
      paymentMethod: textValue(formData, "paymentMethod") || "transferencia",
    })
    .where(eq(receipts.id, id));
  await recalculateReceipt(id);
  revalidatePath("/");
}

export async function updateReceiptTax(formData: FormData) {
  const receiptId = optionalInt(textValue(formData, "receiptId"));
  if (!receiptId) return;
  await db
    .update(receipts)
    .set({
      applyTax: checkboxValue(formData, "applyTax"),
      taxRate: toMoneyFromString(textValue(formData, "taxRate") || "16"),
    })
    .where(eq(receipts.id, receiptId));
  await recalculateReceipt(receiptId);
  revalidatePath("/");
}

export async function addReceiptItem(formData: FormData) {
  const receiptId = optionalInt(textValue(formData, "receiptId"));
  if (!receiptId) return;
  const serviceId = optionalInt(textValue(formData, "serviceId"));
  const service = serviceId
    ? (
        await db
          .select({ id: services.id, name: services.name, unit: services.unit, basePrice: services.basePrice })
          .from(services)
          .where(eq(services.id, serviceId))
          .limit(1)
      )[0]
    : null;
  const quantity = toNumber(textValue(formData, "quantity"), 1);
  const unitPrice = toNumber(
    textValue(formData, "unitPrice"),
    service ? toNumber(String(service.basePrice), 0) : 0
  );
  const description = textValue(formData, "description") || service?.name || "Concepto sin descripción";
  const unit = textValue(formData, "unit") || service?.unit || "pza";
  const lineTotal = quantity * unitPrice;
  await db.insert(receiptItems).values({
    receiptId,
    serviceId,
    description,
    quantity: toMoney(quantity),
    unit,
    unitPrice: toMoney(unitPrice),
    lineTotal: toMoney(lineTotal),
  });
  await recalculateReceipt(receiptId);
  revalidatePath("/");
}

export async function addReceiptPayment(formData: FormData) {
  const receiptId = optionalInt(textValue(formData, "receiptId"));
  if (!receiptId) return;
  const amount = toNumber(textValue(formData, "amount"), 0);
  if (amount <= 0) return;
  await db.insert(receiptPayments).values({
    receiptId,
    amount: toMoney(amount),
    method: textValue(formData, "method") || "transferencia",
    note: optionalText(formData, "note"),
    paidAt: new Date(),
  });
  await recalculateReceipt(receiptId);
  revalidatePath("/");
}

export async function deleteClient(formData: FormData) {
  const id = optionalInt(textValue(formData, "id"));
  if (!id) return;
  await db.delete(clients).where(eq(clients.id, id));
  revalidatePath("/");
}

export async function deleteService(formData: FormData) {
  const id = optionalInt(textValue(formData, "id"));
  if (!id) return;
  await db.delete(services).where(eq(services.id, id));
  revalidatePath("/");
}

export async function deleteQuote(formData: FormData) {
  const id = optionalInt(textValue(formData, "id"));
  if (!id) return;
  await db.delete(quotes).where(eq(quotes.id, id));
  revalidatePath("/");
}

export async function deleteQuoteItem(formData: FormData) {
  const id = optionalInt(textValue(formData, "id"));
  const quoteId = optionalInt(textValue(formData, "quoteId"));
  if (!id || !quoteId) return;
  await db.delete(quoteItems).where(eq(quoteItems.id, id));
  await recalculateQuote(quoteId);
  revalidatePath("/");
}

export async function deleteReceipt(formData: FormData) {
  const id = optionalInt(textValue(formData, "id"));
  if (!id) return;
  await db.delete(receipts).where(eq(receipts.id, id));
  revalidatePath("/");
}

export async function deleteReceiptItem(formData: FormData) {
  const id = optionalInt(textValue(formData, "id"));
  const receiptId = optionalInt(textValue(formData, "receiptId"));
  if (!id || !receiptId) return;
  await db.delete(receiptItems).where(eq(receiptItems.id, id));
  await recalculateReceipt(receiptId);
  revalidatePath("/");
}

export async function deleteReceiptPayment(formData: FormData) {
  const id = optionalInt(textValue(formData, "id"));
  const receiptId = optionalInt(textValue(formData, "receiptId"));
  if (!id || !receiptId) return;
  await db.delete(receiptPayments).where(eq(receiptPayments.id, id));
  await recalculateReceipt(receiptId);
  revalidatePath("/");
}
