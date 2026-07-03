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

  return <div className={`grid aspect-square min-w-0 place-items-center overflow-hidden bg-amber-50 ${className}`}>
    {shouldShowItemImage(imageUrl, failed) ? <img
      src={imageUrl}
      alt={alt ?? itemName}
      onError={() => setFailed(true)}
      className="aspect-square h-full w-full object-cover"
    /> : <div className="grid size-22 min-h-22 min-w-22 place-items-center border-2 border-black bg-amber-100 p-4 shadow-[5px_5px_0_#18130f] box-border sm:size-24 sm:min-h-24 sm:min-w-24" aria-label={`ไม่มีรูป ${itemName}`} data-testid="item-placeholder">
      <span className="block max-w-full text-center text-4xl font-black leading-none text-red-600">{getItemPlaceholderText(itemName)}</span>
    </div>}
  </div>;
}
