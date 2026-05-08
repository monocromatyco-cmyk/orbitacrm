"use client";
import type { AppConfig } from "@/components/crm-shell";
import { saveSettings } from "@/app/actions";

type Props = { config: AppConfig };

export function SettingsView({ config }: Props) {
  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-6 mx-auto">
      <div>
        <h2 className="text-base font-semibold text-slate-800">Configuración del negocio</h2>
        <p className="text-sm text-slate-500 mt-0.5">Datos que aparecen en cotizaciones y recibos.</p>
      </div>

      <form action={saveSettings} className="space-y-5">
        {/* Business info */}
        <Section title="Información del negocio">
          <Field label="Nombre del negocio" name="businessName" defaultValue={config.businessName} required />
          <Field label="URL del logo" name="logoUrl" defaultValue={config.logoUrl ?? ""} type="url" />
          <Field label="Teléfono" name="phone" defaultValue={config.phone ?? ""} type="tel" />
          <Field label="Email" name="email" defaultValue={config.email ?? ""} type="email" />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Dirección</label>
            <textarea name="address" defaultValue={config.address ?? ""} rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none" />
          </div>
        </Section>

        {/* Financial */}
        <Section title="Configuración financiera">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Moneda</label>
              <input type="text" name="currency" defaultValue={config.currency}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">IVA predeterminado (%)</label>
              <input type="number" name="defaultTaxRate" defaultValue={config.defaultTaxRate} step="0.01"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>
        </Section>

        {/* Bank */}
        <Section title="Datos bancarios">
          <Field label="Banco" name="bankName" defaultValue={config.bankName ?? ""} />
          <Field label="Número de cuenta" name="bankAccount" defaultValue={config.bankAccount ?? ""} />
          <Field label="CLABE interbancaria" name="bankClabe" defaultValue={config.bankClabe ?? ""} />
          <Field label="Beneficiario" name="bankBeneficiary" defaultValue={config.bankBeneficiary ?? ""} />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Payload QR (CoDi / pago rápido)</label>
            <textarea name="qrPayload" defaultValue={config.qrPayload ?? ""} rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none" />
          </div>
        </Section>

        <button
          type="submit"
          className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}
