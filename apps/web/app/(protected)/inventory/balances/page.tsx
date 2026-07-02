"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Badge, ErrorBox, PageHeader } from "@/components/page-kit";
import { get } from "@/lib/api";
import type { Category, Item, Location, StockBalance, StoreItem } from "@/lib/types";

export default function BalancesPage() {
  const balances = useQuery({ queryKey: ["balances"], queryFn: () => get<StockBalance[]>("/stock-balances") });
  const items = useQuery({ queryKey: ["items"], queryFn: () => get<Item[]>("/items") });
  const store = useQuery({ queryKey: ["store-items"], queryFn: () => get<StoreItem[]>("/store-items") });
  const locations = useQuery({ queryKey: ["locations"], queryFn: () => get<Location[]>("/locations") });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => get<Category[]>("/categories") });
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const rows = useMemo(
    () => (balances.data ?? []).filter((balance) =>
      (!location || balance.locationId === location)
      && (!category || items.data?.find((item) => item.itemId === balance.itemId)?.categoryId === category)),
    [balances.data, items.data, location, category],
  );

  return <>
    <PageHeader eyebrow="Stock Vault · Live Balance" title="ยอดคงเหลือในคลัง" description="ตรวจยอดสินค้าในแต่ละตำแหน่งและดูสถานะเทียบกับระดับขั้นต่ำ" />
    <div className="mb-4 grid gap-3 sm:grid-cols-2">
      <select className="field" value={location} onChange={(event) => setLocation(event.target.value)}>
        <option value="">ทุกตำแหน่ง</option>
        {locations.data?.map((value, index) => <option key={`location-${value.locationId || "empty"}-${index}`} value={value.locationId}>{value.locationName}</option>)}
      </select>
      <select className="field" value={category} onChange={(event) => setCategory(event.target.value)}>
        <option value="">ทุกหมวด</option>
        {categories.data?.map((value, index) => <option key={`category-${value.categoryId || "empty"}-${index}`} value={value.categoryId}>{value.categoryName}</option>)}
      </select>
    </div>
    {balances.isError ? <ErrorBox error={balances.error} /> : <div className="overflow-x-auto border border-black bg-white">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="bg-black text-white"><tr><th className="p-3">สินค้า</th><th>ตำแหน่ง</th><th>คงเหลือ</th><th>สถานะ</th></tr></thead>
        <tbody>{rows.map((value, index) => {
          const item = items.data?.find((current) => current.itemId === value.itemId);
          const setting = store.data?.find((current) => current.itemId === value.itemId);
          const status = value.currentQty <= 0 ? "หมด" : setting && value.currentQty < setting.minQty ? "ต่ำ" : setting && value.currentQty > setting.targetQty ? "เกินเป้า" : "ปกติ";
          return <tr className="border-t" key={`balance-${value.balanceId || "empty"}-${index}`}>
            <td className="p-3 font-bold">{item?.itemName || value.itemId}</td>
            <td>{locations.data?.find((current) => current.locationId === value.locationId)?.locationName || value.locationId}</td>
            <td className="font-black">{value.currentQty} {item?.unit}</td>
            <td><Badge tone={status === "ปกติ" ? "success" : status === "หมด" ? "danger" : "warning"}>{status}</Badge></td>
          </tr>;
        })}</tbody>
      </table>
    </div>}
  </>;
}
