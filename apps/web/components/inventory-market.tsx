"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ItemImage } from "./item-image";
import type { RequestableItem } from "../lib/types";

const focusRing = "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-600 focus-visible:ring-offset-2";

export function PixelPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`border-2 border-black bg-white shadow-[6px_6px_0_#18130f] ${className}`}>{children}</div>;
}

export function PixelButton({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`market-button min-h-11 border-2 border-black bg-black px-4 py-2.5 font-black text-white shadow-[4px_4px_0_#d62b20] transition-[transform,box-shadow,background-color] duration-100 hover:bg-red-600 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 ${focusRing} ${className}`} {...props}>{children}</button>;
}

export function PixelTab({ label, code, count, active, onClick }: { label: string; code: string; count: number; active: boolean; onClick: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`market-button min-h-20 w-[min(72vw,220px)] shrink-0 snap-start border-2 border-black px-4 py-3 text-left shadow-[4px_4px_0_#18130f] transition-[transform,box-shadow,background-color] duration-100 active:translate-x-1 active:translate-y-1 active:shadow-none sm:w-auto sm:min-w-0 ${focusRing} ${active ? "bg-red-600 text-white" : "bg-white text-black hover:bg-amber-100"}`}>
    <span className={`block font-mono text-[10px] font-black tracking-[.18em] ${active ? "text-red-100" : "text-red-600"}`}>{code}</span>
    <span className="mt-1 flex items-end justify-between gap-3"><span className="text-sm font-black leading-tight">{label}</span><span className={`font-mono text-xs font-black ${active ? "text-white" : "text-stone-500"}`}>{count}</span></span>
  </button>;
}

export function ItemMarketCard({ item, selected, onToggle }: { item: RequestableItem; selected: boolean; onToggle: () => void }) {
  const lowStock = item.totalQty <= item.storeItem.minQty;
  return <article className={`market-card group relative flex min-w-0 flex-col border-2 bg-white transition-[transform,box-shadow,border-color] duration-150 ${selected ? "border-red-600 shadow-[6px_6px_0_#d62b20]" : "border-black shadow-[5px_5px_0_#18130f] hover:-translate-y-1 hover:shadow-[7px_7px_0_#18130f]"}`}>
    {selected && <span className="absolute right-2 top-2 z-10 border-2 border-black bg-red-600 px-2 py-1 text-[10px] font-black tracking-wider text-white shadow-[2px_2px_0_#18130f]">เลือกแล้ว</span>}
    <div className="relative aspect-square overflow-hidden border-b-2 border-black bg-amber-50">
      <ItemImage src={item.imageUrl} itemName={item.itemName} className="h-full w-full bg-[linear-gradient(90deg,rgba(24,19,15,.06)_1px,transparent_1px),linear-gradient(rgba(24,19,15,.06)_1px,transparent_1px)] bg-[size:16px_16px]" />
      <div className="absolute bottom-2 left-2 flex gap-1.5">
        <StatusChip tone={lowStock ? "danger" : "neutral"}>{lowStock ? "ของใกล้หมด" : `คงเหลือ ${item.totalQty}`}</StatusChip>
      </div>
    </div>
    <div className="flex flex-1 flex-col p-3.5 sm:p-4">
      <h3 className="line-clamp-2 text-base font-black leading-snug sm:text-lg">{item.itemName}</h3>
      <p className="mt-1 text-xs font-bold text-stone-500">หน่วยเบิก · {item.unit}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="flex min-w-0 flex-col gap-2 border-2 border-dashed border-black bg-white p-3">
          <span className="text-[10px] font-bold uppercase leading-none text-neutral-500">MIN</span>
          <input aria-label={`MIN ${item.itemName}`} className="h-10 w-full min-w-0 bg-transparent px-1 text-base font-bold leading-normal outline-none" value={item.storeItem.minQty} readOnly />
        </label>
        <label className="flex min-w-0 flex-col gap-2 border-2 border-dashed border-black bg-white p-3">
          <span className="text-[10px] font-bold uppercase leading-none text-neutral-500">TARGET</span>
          <input aria-label={`TARGET ${item.itemName}`} className="h-10 w-full min-w-0 bg-transparent px-1 text-base font-bold leading-normal outline-none" value={item.storeItem.targetQty} readOnly />
        </label>
      </div>
      <PixelButton type="button" onClick={onToggle} aria-pressed={selected} className={`mt-4 min-h-12 w-full text-sm sm:text-base ${selected ? "bg-white text-red-700 shadow-[4px_4px_0_#18130f] hover:bg-red-50" : ""}`}>{selected ? "− เอาออกจากกระเป๋า" : "+ ใส่กระเป๋า"}</PixelButton>
    </div>
  </article>;
}

export function StatusChip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "danger" }) {
  return <span className={`inline-flex min-h-6 items-center border-2 border-black px-2 text-[10px] font-black shadow-[2px_2px_0_#18130f] ${tone === "danger" ? "bg-red-600 text-white" : "bg-amber-100 text-black"}`}>{children}</span>;
}

export function EmptyStatePixel({ title, description }: { title: string; description: string }) {
  return <PixelPanel className="px-5 py-12 text-center sm:py-16">
    <div className="mx-auto mb-5 grid h-16 w-16 place-items-center border-2 border-black bg-amber-100 shadow-[4px_4px_0_#18130f]" aria-hidden="true"><span className="text-3xl">?</span></div>
    <p className="text-lg font-black">{title}</p>
    <p className="mt-1 text-sm text-stone-500">{description}</p>
  </PixelPanel>;
}

export function SearchIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>;
}
