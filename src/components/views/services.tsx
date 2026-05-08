"use client";
import { useState } from "react";
import type { AppConfig, Service } from "@/components/crm-shell";
import { Modal } from "@/components/ui/modal";
import { money, n } from "@/lib/fmt";
import { createService, deleteService, updateService } from "@/app/actions";
import { Search, Plus, Pencil, Trash2 } from "@/components/icons";

type Props = { serviceRows: Service[]; config: AppConfig };

const emptyService = { name: "", description: "", unit: "pza", basePrice: "" };

export function ServicesView({ serviceRows, config }: Props) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Service | null>(null);

  const filtered = serviceRows.filter((s) => {
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.description ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar servicios…"
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
            {search ? "Sin resultados." : "No hay servicios todavía."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Unidad</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Precio base</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className="group hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{s.name}</p>
                    {s.description && <p className="text-xs text-slate-400 truncate max-w-xs">{s.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{s.unit}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-700">
                    {money(n(s.basePrice), config.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditing(s)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(s)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <Modal title="Nuevo servicio" onClose={() => setShowAdd(false)}>
          <form
            action={async (fd) => {
              await createService(fd);
              setShowAdd(false);
            }}
            className="space-y-3"
          >
            <ServiceFields defaults={emptyService} />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Guardar</button>
            </div>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title="Editar servicio" onClose={() => setEditing(null)}>
          <form
            action={async (fd) => {
              fd.append("id", String(editing.id));
              await updateService(fd);
              setEditing(null);
            }}
            className="space-y-3"
          >
            <ServiceFields
              defaults={{
                name: editing.name,
                description: editing.description ?? "",
                unit: editing.unit,
                basePrice: editing.basePrice,
              }}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Actualizar</button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Eliminar servicio" onClose={() => setConfirmDelete(null)}>
          <p className="text-sm text-slate-600 mb-4">
            ¿Eliminar <strong>{confirmDelete.name}</strong>? Esta acción no se puede deshacer.
          </p>
          <form
            action={async (fd) => {
              await deleteService(fd);
              setConfirmDelete(null);
            }}
          >
            <input type="hidden" name="id" value={confirmDelete.id} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">Eliminar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function ServiceFields({ defaults }: { defaults: typeof emptyService }) {
  return (
    <>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Nombre *</label>
        <input type="text" name="name" defaultValue={defaults.name} required
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Descripción</label>
        <textarea name="description" defaultValue={defaults.description} rows={2}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Unidad</label>
          <input type="text" name="unit" defaultValue={defaults.unit}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Precio base</label>
          <input type="number" name="basePrice" defaultValue={defaults.basePrice} step="0.01" min="0"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </div>
      </div>
    </>
  );
}
