"use client";

import { useEffect, useState } from "react";
import { getItemPlaceholderText, normalizeImageUrl, shouldShowItemImage } from "../lib/image-url";

export type ItemImageProps = {
  src?: string | null;
  itemName: string;
  alt?: string;
  className?: string;
};

export function ItemImage({ src, itemName, alt, className = "" }: ItemImageProps) {
  const imageUrl = normalizeImageUrl(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [imageUrl]);

  return <div className={`grid min-w-0 place-items-center overflow-hidden bg-amber-50 ${className}`}>
    {shouldShowItemImage(imageUrl, failed) ? <img
      src={imageUrl}
      alt={alt ?? itemName}
      onError={() => setFailed(true)}
      className="h-full w-full object-contain p-2 [image-rendering:pixelated]"
    /> : <PixelProductFallback itemName={itemName} />}
  </div>;
}

function PixelProductFallback({ itemName }: { itemName: string }) {
  const name = itemName.toLowerCase();
  const kind = /หมู|เนื้อ|ไก่|ปลา|กุ้ง/.test(name) ? "meat"
    : /น้ำ|ซอส|ซีอิ๊ว|ขวด|เครื่องดื่ม|นม/.test(name) ? "bottle"
    : /ข้าว|แป้ง|น้ำตาล|เกลือ/.test(name) ? "sack"
    : /ผัก|พริก|กระเทียม|หอม|ผล|ไข่/.test(name) ? "produce"
    : "crate";

  return <div className="pixel-product grid h-full min-h-22 w-full place-items-center p-4" aria-label={`ภาพสินค้า ${itemName}`} data-testid="item-placeholder">
    <span className="sr-only leading-none">{getItemPlaceholderText(itemName)}</span>
    <svg viewBox="0 0 96 72" className="h-full max-h-[104px] w-full max-w-[138px] leading-none drop-shadow-[4px_5px_0_rgba(91,54,29,.16)]" shapeRendering="crispEdges" aria-hidden="true">
      {kind === "meat" && <>
        <path fill="#6b351f" d="M19 25h8v-7h34v5h11v7h7v21h-8v7H27v-5h-9V32h-5v-7z"/>
        <path fill="#c85842" d="M20 26h10v-6h29v5h12v7h6v17h-9v6H29v-5h-8V33h-5v-6z"/>
        <path fill="#f28c74" d="M28 26h29v5h11v7h-9v6H28v-5h-7v-7h7z"/>
        <path fill="#fff1d6" d="M31 29h24v4H31zm-5 10h31v4H26z"/>
      </>}
      {kind === "bottle" && <>
        <path fill="#55301f" d="M39 7h18v11h5v7h6v38H28V25h6v-7h5z"/>
        <path fill="#e4a33e" d="M41 9h14v7H41z"/><path fill="#6e3b23" d="M37 22h22v7h5v30H32V29h5z"/>
        <path fill="#fff4d7" d="M35 35h26v17H35z"/><path fill="#62a6a1" d="M41 39h14v9H41z"/>
        <path fill="#c98535" d="M37 25h22v6H37z"/>
      </>}
      {kind === "sack" && <>
        <path fill="#735039" d="M30 9h36v8h-5l8 12v30H27V29l8-12h-5z"/>
        <path fill="#f4ead4" d="M34 11h28v5H34zm3 8h22l7 12v25H30V31z"/>
        <path fill="#dfcba7" d="M30 31h36v5H30z"/><path fill="#c55d3c" d="M38 38h20v12H38z"/>
        <path fill="#fff6e5" d="M43 41h10v6H43z"/>
      </>}
      {kind === "produce" && <>
        <path fill="#644127" d="M20 34h57v22H70v7H27v-7h-7z"/><path fill="#b96d2e" d="M24 37h49v16h-6v6H30v-6h-6z"/>
        <path fill="#4d7329" d="M25 31h8v-8h8v12h8V20h7v12h8V24h7v11H25z"/>
        <path fill="#85a83c" d="M30 27h9v12h9V25h8v12h11v8H29z"/>
        <path fill="#df7a35" d="M34 38h11v12H34zm21-2h10v14H55z"/>
      </>}
      {kind === "crate" && <>
        <path fill="#593820" d="M17 22h62v41H17z"/><path fill="#b96c2d" d="M21 26h54v33H21z"/>
        <path fill="#e2a04b" d="M25 30h46v7H25zm0 18h46v7H25z"/><path fill="#74401f" d="M28 26h7v33h-7zm33 0h7v33h-7z"/>
        <path fill="#f1bf68" d="M39 39h18v7H39z"/>
      </>}
    </svg>
  </div>;
}
