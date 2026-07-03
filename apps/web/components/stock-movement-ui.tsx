"use client";

import type { ChangeEventHandler } from "react";
import { ItemImage } from "./item-image";
import { adjustQuantity, MOVEMENT_ACTIONS, type MovementType } from "../lib/movement-workflow";
import type { Item } from "../lib/types";

const focus = "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-600 focus-visible:ring-offset-2";

export function MovementTypePicker({ value, onChange, onCount }: { value: MovementType; onChange: (value: MovementType) => void; onCount: () => void }) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7" aria-label="เลือกประเภทงาน">
    {MOVEMENT_ACTIONS.slice(0, 2).map((action) => <MovementActionButton key={action.value} action={action} active={value === action.value} onClick={() => onChange(action.value)} />)}
    <button type="button" onClick={onCount} className={`min-h-28 border-2 border-black bg-amber-100 p-3 text-left shadow-[4px_4px_0_#18130f] transition-[transform,box-shadow,background-color] hover:bg-red-600 hover:text-white active:translate-x-1 active:translate-y-1 active:shadow-none ${focus}`}>
      <span className="font-mono text-[10px] font-black tracking-[.18em] opacity-70">COUNT</span>
      <span className="mt-2 block text-base font-black leading-tight">นับสต๊อก</span>
      <span className="mt-1 hidden text-xs font-bold opacity-70 sm:block">ตรวจนับหลายรายการ</span>
    </button>
    {MOVEMENT_ACTIONS.slice(2).map((action) => <MovementActionButton key={action.value} action={action} active={value === action.value} onClick={() => onChange(action.value)} />)}
  </div>;
}

function MovementActionButton({ action, active, onClick }: { action: typeof MOVEMENT_ACTIONS[number]; active: boolean; onClick: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`min-h-28 border-2 border-black p-3 text-left shadow-[4px_4px_0_#18130f] transition-[transform,box-shadow,background-color] active:translate-x-1 active:translate-y-1 active:shadow-none ${focus} ${active ? "bg-red-600 text-white" : "bg-white hover:bg-amber-100"}`}>
      <span className="font-mono text-[10px] font-black tracking-[.18em] opacity-70">{action.code}</span>
      <span className="mt-2 block text-base font-black leading-tight">{action.label}</span>
      <span className="mt-1 hidden text-xs font-bold opacity-70 sm:block">{action.description}</span>
    </button>;
}

export function MovementProductCard({ item, balance, onSelect }: { item: Item; balance: number; onSelect: (itemId: string) => void }) {
  return <button type="button" data-item-id={item.itemId} onClick={() => onSelect(item.itemId)} className={`group flex min-w-0 flex-col overflow-hidden border-2 border-black bg-white text-left shadow-[5px_5px_0_#18130f] transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-[7px_7px_0_#d62b20] ${focus}`}>
    <ItemImage src={item.imageUrl} itemName={item.itemName} className="w-full border-b-2 border-black" />
    <span className="flex min-w-0 flex-1 flex-col p-3">
      <span className="truncate font-black">{item.itemName}</span>
      <span className="mt-1 text-xs font-bold text-stone-500">หน่วย · {item.unit}</span>
      <span className="mt-3 border-t-2 border-dashed border-black pt-2 text-xs font-black">คงเหลือ {balance} {item.unit}</span>
    </span>
  </button>;
}

export function QuantityStepper({ value, unit, minimum = 0.01, ariaLabel = "จำนวน Movement", onChange }: { value: number; unit: string; minimum?: number; ariaLabel?: string; onChange: (value: number) => void }) {
  const input: ChangeEventHandler<HTMLInputElement> = (event) => onChange(Number(event.target.value));
  return <div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {[-10, -1, 1, 10].map((delta) => <button key={delta} type="button" onClick={() => onChange(adjustQuantity(value, delta, minimum))} className={`min-h-12 border-2 border-black bg-amber-100 px-3 font-black shadow-[3px_3px_0_#18130f] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${focus}`}>{delta > 0 ? `+${delta}` : delta}</button>)}
    </div>
    <label className="mt-3 block font-black">จำนวน
      <span className="mt-2 flex min-w-0 items-stretch border-2 border-black bg-white shadow-[4px_4px_0_#18130f]">
        <input aria-label={ariaLabel} className="min-h-14 min-w-0 flex-1 bg-transparent px-4 text-2xl font-black leading-normal outline-none" type="number" inputMode="decimal" min={minimum} step="0.01" value={value} onChange={input} />
        <span className="grid min-w-16 place-items-center border-l-2 border-black bg-amber-100 px-3 font-black">{unit}</span>
      </span>
    </label>
  </div>;
}
