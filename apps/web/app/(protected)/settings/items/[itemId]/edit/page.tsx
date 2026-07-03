"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ItemConfigForm } from "@/components/item-config-form";
import { ErrorBox } from "@/components/page-kit";
import { get } from "@/lib/api";
import type { Item } from "@/lib/types";

export default function EditItemPage() {
  const itemId = decodeURIComponent(String(useParams().itemId));
  const query = useQuery({ queryKey: ["items"], queryFn: () => get<Item[]>("/items") });
  if (query.isLoading) return <div className="panel animate-pulse p-8"><div className="h-6 w-40 bg-stone-200"/><div className="mt-4 h-12 bg-stone-200"/><div className="mt-4 h-48 bg-stone-200"/></div>;
  if (query.isError) return <ErrorBox error={query.error} retry={() => query.refetch()} />;
  const item = query.data?.find((value) => value.itemId === itemId && value.itemId.trim() !== "" && value.itemName.trim() !== "");
  if (!item) return <div className="border-2 border-black bg-white p-8 text-center shadow-[5px_5px_0_#d62b20]"><p className="font-black">ไม่พบไอเทมรหัส {itemId}</p><Link href="/settings/items" className="btn-secondary mt-5 inline-flex">กลับรายการไอเทม</Link></div>;
  return <ItemConfigForm item={item} />;
}
