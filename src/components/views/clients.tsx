"use client";
import { useState } from "react";
import type { Client } from "@/components/crm-shell";
import { Modal } from "@/components/ui/modal";
import { dt } from "@/lib/fmt";
import { createClient, deleteClient, updateClient } from "@/app/actions";
import { Search, Plus, Pencil, Trash2, Phone, Mail, MapPin } from "@/components/icons";

type Props = { clientRows: Client[] };

const emptyClient = {
  fullName: "",
  companyName: "",
  representativeName: "",
  role: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

export function ClientsView({ clientRows }: Props) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Client | null>(null);

  const filtered = clientRows.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      (c.companyName ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.phone ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar clientes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
        >
          <Plus size={16} />
          Agregar
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
          <p className="text-slate-400 text-sm">
            {search ? "Sin resultados." : "No hay clientes todavía. ¡Agrega el primero!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="group rounded-2xl border border-slate-200 bg-white p-4 hover:border-blue-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 truncate">{c.companyName || c.fullName}</p>
                  {c.companyName && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{c.representativeName || c.fullName}</p>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditing(c)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(c)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                {c.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone size={12} className="text-slate-400" /> {c.phone}
                  </p>
                )}
                {c.email && (
                  <p className="flex items-center gap-1.5">
                    <Mail size={12} className="text-slate-400" /> {c.email}
                  </p>
                )}
                {c.address && (
                  <p className="flex items-center gap-1.5 truncate">
                    <MapPin size={12} className="text-slate-400 shrink-0" /> {c.address}
                  </p>
                )}
              </div>
              <p className="mt-3 text-[11px] text-slate-400">Alta: {dt(c.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <Modal title="Nuevo cliente" onClose={() => setShowAdd(false)}>
          <form
            action={async (fd) => {
              await createClient(fd);
              setShowAdd(false);
            }}
            className="space-y-3"
          >
            <ClientFields defaults={emptyClient} />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">
                Cancelar
              </button>
              <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Guardar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit modal */}
      {editing && (
        <Modal title="Editar cliente" onClose={() => setEditing(null)}>
          <form
            action={async (fd) => {
              fd.append("id", String(editing.id));
              await updateClient(fd);
              setEditing(null);
            }}
            className="space-y-3"
          >
            <ClientFields
              defaults={{
                fullName: editing.fullName,
                companyName: editing.companyName ?? "",
                representativeName: editing.representativeName ?? "",
                role: editing.role ?? "",
                phone: editing.phone ?? "",
                email: editing.email ?? "",
                address: editing.address ?? "",
                notes: editing.notes ?? "",
              }}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">
                Cancelar
              </button>
              <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Actualizar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <Modal title="Eliminar cliente" onClose={() => setConfirmDelete(null)}>
          <p className="text-sm text-slate-600 mb-4">
            ¿Eliminar a <strong>{confirmDelete.companyName || confirmDelete.fullName}</strong>? Esta acción no se puede deshacer.
          </p>
          <form
            action={async (fd) => {
              await deleteClient(fd);
              setConfirmDelete(null);
            }}
          >
            <input type="hidden" name="id" value={confirmDelete.id} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">
                Cancelar
              </button>
              <button type="submit" className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">
                Eliminar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function ClientFields({ defaults }: { defaults: typeof emptyClient }) {
  return (
    <>
      <Field label="Nombre completo *" name="fullName" defaultValue={defaults.fullName} required />
      <Field label="Empresa" name="companyName" defaultValue={defaults.companyName} />
      <Field label="Representante" name="representativeName" defaultValue={defaults.representativeName} />
      <Field label="Cargo / Rol" name="role" defaultValue={defaults.role} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Teléfono" name="phone" defaultValue={defaults.phone} type="tel" />
        <Field label="Email" name="email" defaultValue={defaults.email} type="email" />
      </div>
      <Field label="Dirección" name="address" defaultValue={defaults.address} />
      <TextareaField label="Notas" name="notes" defaultValue={defaults.notes} />
    </>
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

function TextareaField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={2}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
      />
    </div>
  );
}
