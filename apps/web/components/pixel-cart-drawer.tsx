"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function CartViewportPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}

export function PixelCartDrawer({ children, footer, onClose }: { children: ReactNode; footer?: ReactNode; onClose: () => void }) {
  return <div className="market-backdrop fixed inset-0 z-[60] overflow-hidden">
    <button type="button" aria-label="ปิดรถเข็นเบิกของ" onClick={onClose} className="absolute inset-0 z-0 cursor-default bg-black/60" />
    <aside role="dialog" aria-modal="true" aria-labelledby="backpack-title" className="market-drawer absolute inset-y-0 right-0 z-10 flex h-[100dvh] w-full max-w-[480px] min-w-0 flex-col overflow-hidden border-l-2 border-black bg-[#fff9e5] shadow-[-6px_0_0_#d62b20]">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b-2 border-black p-4 sm:p-6">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-black tracking-[.2em] text-red-700">PIXEL CART</p>
          <h2 id="backpack-title" className="mt-1 text-2xl font-black">รถเข็นเบิกของ</h2>
          <p className="mt-1 text-sm text-stone-500">ตรวจสอบของที่เลือกก่อนส่งคำขอ</p>
        </div>
        <button type="button" onClick={onClose} aria-label="ปิดรถเข็นเบิกของ" className="market-button grid min-h-11 min-w-11 shrink-0 place-items-center border-2 border-black bg-white text-xl font-black shadow-[3px_3px_0_#18130f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-600 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none">×</button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">{children}</div>
      {footer && <footer className="shrink-0 border-t-2 border-black bg-[#fff9e5] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:p-6">{footer}</footer>}
    </aside>
  </div>;
}
