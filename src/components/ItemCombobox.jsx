import { useEffect, useMemo, useRef, useState } from "react";
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";

export default function ItemCombobox({ items, value, onChange, label, disabled = false }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const options = useMemo(() => items.map(item => ({
    id: String(item.item_id ?? item.id),
    name: item.item_name || item.nama || item.nama_barang || "-",
  })), [items]);
  const selected = options.find(item => item.id === String(value));
  const keyword = query.trim().toLocaleLowerCase("id-ID");
  const filtered = options.filter(item => item.name.toLocaleLowerCase("id-ID").includes(keyword));

  useEffect(() => {
    // Free text is a search query, not a valid item selection.
    inputRef.current?.setCustomValidity(selected ? "" : "Pilih barang dari daftar.");
  }, [selected]);

  return <Combobox value={value || null} onChange={id => {
    if (id !== null) onChange(id);
    setQuery("");
  }} onClose={() => setQuery("")} immediate disabled={disabled}>
    <div className="relative min-w-0">
      <ComboboxInput
        ref={inputRef}
        required
        aria-label={label}
        autoComplete="off"
        placeholder="Pilih atau cari barang…"
        displayValue={id => options.find(item => item.id === String(id))?.name || ""}
        onChange={event => setQuery(event.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
      />
      <ComboboxButton type="button" aria-label={`Buka pilihan ${label.toLowerCase()}`} className="absolute inset-y-0 right-0 rounded-r-lg px-2 text-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50">
        <ChevronDown size={16} aria-hidden="true" />
      </ComboboxButton>
    </div>
    <ComboboxOptions anchor="bottom start" portal modal={false} className="z-[70] max-h-60 w-[var(--input-width)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg outline-none [--anchor-gap:4px] [--anchor-padding:12px] empty:invisible">
      {filtered.map(item => <ComboboxOption key={item.id} value={item.id} className="group flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-slate-700 data-focus:bg-blue-50 data-focus:text-blue-700 data-selected:font-semibold">
        <span className="min-w-0 break-words">{item.name}</span>
        <Check size={15} aria-hidden="true" className="invisible shrink-0 text-blue-600 group-data-selected:visible" />
      </ComboboxOption>)}
      {!filtered.length && <p role="status" className="px-3 py-3 text-sm text-slate-500">Barang tidak ditemukan.</p>}
    </ComboboxOptions>
  </Combobox>;
}
