"use client";

import { ItemImage } from "./item-image";
import { QuantityStepper } from "./stock-movement-ui";
import type { Item } from "../lib/types";

export function StockCountCard({ item, systemQty, countedQty, note, onCountedQtyChange, onNoteChange }: { item: Item; systemQty: number; countedQty: number; note: string; onCountedQtyChange: (value: number) => void; onNoteChange: (value: string) => void }) {
  const difference = countedQty - systemQty;
  return <article className="min-w-0 overflow-hidden border-2 border-black bg-[#fffdf4] shadow-[5px_5px_0_#18130f]">
    <header className="grid grid-cols-[88px_minmax(0,1fr)] border-b-2 border-black">
      <ItemImage src={item.imageUrl} itemName={item.itemName} className="h-full w-full border-r-2 border-black" />
      <div className="min-w-0 p-3"><p className="truncate text-lg font-black">{item.itemName}</p><p className="mt-1 text-xs font-bold text-stone-500">ระบบ {systemQty} {item.unit}</p><p className={`mt-2 font-mono text-xs font-black ${difference < 0 ? "text-red-700" : difference > 0 ? "text-amber-700" : "text-stone-500"}`}>ต่าง {difference}</p></div>
    </header>
    <div className="space-y-4 p-4">
      <QuantityStepper value={countedQty} unit={item.unit} minimum={0} ariaLabel={`จำนวนจริง ${item.itemName}`} onChange={(value) => onCountedQtyChange(Math.max(0, value))} />
      <label className="block text-sm font-black">หมายเหตุรายการ<input className="field mt-2" value={note} onChange={(event) => onNoteChange(event.target.value)} placeholder="ระบุเมื่อยอดต่าง (ถ้ามี)" /></label>
    </div>
  </article>;
}
