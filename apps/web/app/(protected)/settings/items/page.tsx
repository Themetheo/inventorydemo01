"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ItemImage } from "@/components/item-image";
import { Empty, ErrorBox, PageHeader } from "@/components/page-kit";
import { get, patch, post } from "@/lib/api";
import { isValidItemImageInput } from "@/lib/image-url";
import type { Category, Item, SessionUser } from "@/lib/types";

const schema = z.object({
  itemName: z.string().trim().min(1, "กรุณากรอกชื่อสินค้า"),
  categoryId: z.string().trim().min(1, "กรุณาเลือกหมวดหมู่"),
  unit: z.string().trim().min(1, "กรุณากรอกหน่วย"),
  imageUrl: z.string().refine(isValidItemImageInput, "ใช้ path ที่ขึ้นต้นด้วย / หรือ URL แบบ HTTPS และไฟล์ webp, png, jpg, jpeg"),
  description: z.string(),
  isActive: z.boolean(),
});
type Form = z.infer<typeof schema>;
const defaults: Form = { itemName: "", categoryId: "", unit: "", imageUrl: "", description: "", isActive: true };

export default function ItemsPage() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [editing, setEditing] = useState<Item | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState("");
  const items = useQuery({ queryKey: ["items"], queryFn: () => get<Item[]>("/items") });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => get<Category[]>("/categories") });
  const me = useQuery({ queryKey: ["me"], queryFn: () => get<SessionUser>("/auth/me"), retry: false });
  const form = useForm<Form>({ resolver: zodResolver(schema), defaultValues: defaults });
  const canEdit = me.data?.role === "owner" || me.data?.role === "manager";

  const refreshItems = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["items"] }),
      client.invalidateQueries({ queryKey: ["requestable-items"] }),
    ]);
  };
  const save = useMutation({
    mutationFn: ({ value, itemId }: { value: Form; itemId?: string }) => itemId ? patch<Item>(`/items/${itemId}`, value) : post<Item>("/items", value),
    onSuccess: async (item) => {
      await refreshItems();
      setSuccess(`บันทึก ${item.itemName} เรียบร้อยแล้ว`);
      setShowForm(false);
      setEditing(null);
      form.reset(defaults);
    },
  });
  const deactivate = useMutation({
    mutationFn: (item: Item) => patch<Item>(`/items/${item.itemId}`, { isActive: false }),
    onSuccess: async (item) => {
      await refreshItems();
      setSuccess(`ปิดใช้งาน ${item.itemName} แล้ว`);
      setShowForm(false);
      setEditing(null);
      form.reset(defaults);
    },
  });

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return (items.data ?? []).filter((item) =>
      item.itemName.toLowerCase().includes(keyword)
      && (!category || item.categoryId === category)
      && (activeFilter === "all" || (activeFilter === "active" ? item.isActive : !item.isActive)),
    );
  }, [items.data, search, category, activeFilter]);

  const openNew = () => {
    setEditing(null);
    setSuccess("");
    form.reset(defaults);
    setShowForm(true);
  };
  const openEdit = (item: Item) => {
    setEditing(item);
    setSuccess("");
    form.reset({ itemName: item.itemName, categoryId: item.categoryId, unit: item.unit, imageUrl: item.imageUrl, description: item.description, isActive: item.isActive });
    setShowForm(true);
  };
  const submit = (value: Form) => save.mutate({
    itemId: editing?.itemId,
    value: {
      ...value,
      itemName: value.itemName.trim(),
      categoryId: value.categoryId.trim(),
      unit: value.unit.trim(),
      imageUrl: value.imageUrl.trim(),
      description: value.description.trim(),
    },
  });
  const previewUrl = form.watch("imageUrl");
  const previewName = form.watch("itemName") || editing?.itemName || "สินค้า";

  return <>
    <PageHeader
      eyebrow="Item Catalog · Master Data"
      title="ตั้งค่าไอเทม"
      description="จัดการชื่อ หมวดหมู่ หน่วย และรูปสินค้าของร้าน"
      actions={canEdit ? <button className="btn-primary" onClick={openNew}>+ เพิ่มไอเทม</button> : undefined}
    />

    <div className="mb-5 flex flex-col gap-3 border-b-2 border-black pb-5 lg:flex-row lg:items-end">
      <label className="min-w-0 flex-1 text-xs font-black">ค้นหาจากชื่อสินค้า<input className="field mt-1" placeholder="เช่น หมูแดง" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <label className="text-xs font-black lg:w-56">หมวดหมู่<select className="field mt-1" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">ทุกหมวดหมู่</option>{categories.data?.map((value, index) => <option key={`category-${value.categoryId || "empty"}-${index}`} value={value.categoryId}>{value.categoryName}</option>)}</select></label>
      <label className="text-xs font-black lg:w-52">สถานะ<select className="field mt-1" value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as typeof activeFilter)}><option value="all">ทั้งหมด</option><option value="active">เปิดใช้งาน</option><option value="inactive">ปิดใช้งาน</option></select></label>
    </div>

    <div className="mb-6 flex flex-col gap-3 border-2 border-black bg-amber-100 p-4 shadow-[4px_4px_0_#18130f] sm:flex-row sm:items-center sm:justify-between">
      <div><p className="font-mono text-[10px] font-black tracking-[.18em] text-red-700">ITEM MASTER</p><p className="mt-1 text-sm font-bold">ข้อมูลกลาง เช่น ชื่อ รูป หน่วย และหมวดหมู่</p></div>
      <Link href="/settings/store-items" className="btn-secondary inline-flex items-center justify-center">ไปตั้งค่าไอเทมสาขา →</Link>
    </div>

    {success && <div role="status" className="mb-5 border-2 border-black bg-white p-4 shadow-[5px_5px_0_#18130f]"><p className="font-mono text-[10px] font-black tracking-[.2em] text-red-700">SAVE COMPLETE</p><p className="mt-1 font-black">{success}</p></div>}
    {!canEdit && me.data && <div className="mb-5 border-2 border-black bg-amber-100 p-4 font-bold">บัญชีนี้ดูรายการได้ แต่ไม่มีสิทธิ์แก้ไขข้อมูลไอเทม</div>}
    {items.isError ? <ErrorBox error={items.error} retry={() => items.refetch()} /> : !filtered.length ? <Empty text="ไม่พบไอเทมตามตัวกรอง" /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {filtered.map((item, index) => <article key={`item-${item.itemId || "empty"}-${index}`} className="overflow-hidden border-2 border-black bg-white">
        <div className="grid grid-cols-[112px_minmax(0,1fr)]">
          <ItemImage src={item.imageUrl} itemName={item.itemName} className="h-full w-full border-r-2 border-black" />
          <div className="min-w-0 p-4">
            <p className="font-mono text-[9px] font-black tracking-wider text-red-700">{item.itemId || "NO ID"}</p>
            <h2 className="mt-1 truncate text-lg font-black">{item.itemName}</h2>
            <p className="mt-1 text-sm font-bold text-stone-500">{categories.data?.find((value) => value.categoryId === item.categoryId)?.categoryName || item.categoryId} · {item.unit}</p>
            <span className={`mt-3 inline-flex border-2 border-black px-2 py-1 font-mono text-[9px] font-black ${item.isActive ? "bg-black text-white" : "bg-red-600 text-white"}`}>{item.isActive ? "ACTIVE" : "INACTIVE"}</span>
          </div>
        </div>
        {canEdit && <button className="min-h-11 w-full border-t-2 border-black bg-amber-100 px-4 text-left font-black hover:bg-red-600 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-red-600" onClick={() => openEdit(item)}>แก้ไขไอเทม →</button>}
      </article>)}
    </div>}

    {showForm && <div className="market-backdrop fixed inset-0 z-50 bg-black/60 sm:grid sm:place-items-center sm:p-4" onMouseDown={(event) => { if (event.currentTarget === event.target && !save.isPending && !deactivate.isPending) setShowForm(false); }}>
      <form role="dialog" aria-modal="true" aria-labelledby="item-form-title" onSubmit={form.handleSubmit(submit)} className="pixel-modal market-drawer h-[100dvh] w-full overflow-y-auto bg-[#fff9e5] p-4 sm:h-auto sm:max-h-[92dvh] sm:max-w-3xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4 border-b-2 border-black pb-4">
          <div><p className="font-mono text-[10px] font-black tracking-[.2em] text-red-700">ITEM CONFIG</p><h2 id="item-form-title" className="mt-1 text-2xl font-black">{editing ? "แก้ไขไอเทม" : "เพิ่มไอเทม"}</h2></div>
          <button type="button" aria-label="ปิดฟอร์ม" className="grid min-h-11 min-w-11 place-items-center border-2 border-black bg-white text-xl font-black shadow-[3px_3px_0_#18130f]" onClick={() => setShowForm(false)} disabled={save.isPending || deactivate.isPending}>×</button>
        </div>

        <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
          <section>
            <p className="mb-2 text-xs font-black">ตัวอย่างรูปสินค้า</p>
            <div className="border-2 border-black bg-white p-3 shadow-[5px_5px_0_#18130f]"><ItemImage src={previewUrl} itemName={previewName} className="w-full" /></div>
            <p className="mt-3 text-xs leading-relaxed text-stone-600">วางไฟล์ใน <b>public/images/items</b> แล้วกรอก path เช่น <b>/images/items/red-pork.webp</b></p>
          </section>
          <div className="space-y-4">
            <Field label="ชื่อสินค้า" error={form.formState.errors.itemName?.message}><input className="field" autoFocus {...form.register("itemName")} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="หมวดหมู่" error={form.formState.errors.categoryId?.message}><select className="field" {...form.register("categoryId")}><option value="">เลือกหมวดหมู่</option>{categories.data?.map((value, index) => <option key={`form-category-${value.categoryId || "empty"}-${index}`} value={value.categoryId}>{value.categoryName}</option>)}</select></Field>
              <Field label="หน่วย" error={form.formState.errors.unit?.message}><input className="field" placeholder="เช่น กก., ชิ้น, ขวด" {...form.register("unit")} /></Field>
            </div>
            <Field label="Image URL" error={form.formState.errors.imageUrl?.message} help="รองรับ local path ที่ขึ้นต้นด้วย / หรือ full HTTPS URL">
              <div className="flex gap-2"><input className="field min-w-0" placeholder="/images/items/red-pork.webp" {...form.register("imageUrl")} /><button type="button" className="btn-secondary shrink-0" onClick={() => form.setValue("imageUrl", "", { shouldValidate: true })}>ล้างรูป</button></div>
            </Field>
            <Field label="คำอธิบาย"><textarea className="field min-h-24 resize-y" {...form.register("description")} /></Field>
            <label className="flex min-h-11 items-center gap-3 border-2 border-black bg-white px-3 text-sm font-black"><input type="checkbox" {...form.register("isActive")} /> เปิดใช้งาน</label>
          </div>
        </div>

        {(save.error || deactivate.error) && <div className="mt-5"><ErrorBox error={save.error || deactivate.error} /></div>}
        <div className="mt-6 flex flex-col-reverse gap-3 border-t-2 border-black pt-5 sm:flex-row sm:justify-between">
          <div>{editing?.isActive && <button type="button" className="btn-secondary w-full text-red-700 sm:w-auto" disabled={save.isPending || deactivate.isPending} onClick={() => deactivate.mutate(editing)}>{deactivate.isPending ? "กำลังปิดใช้งาน..." : "ปิดใช้งาน"}</button>}</div>
          <div className="flex gap-3"><button type="button" className="btn-secondary flex-1 sm:flex-none" onClick={() => setShowForm(false)} disabled={save.isPending || deactivate.isPending}>ยกเลิก</button><button className="btn-primary flex-1 sm:flex-none" disabled={save.isPending || deactivate.isPending}>{save.isPending ? "กำลังบันทึก..." : "บันทึกไอเทม"}</button></div>
        </div>
      </form>
    </div>}
  </>;
}

function Field({ label, children, error, help }: { label: string; children: React.ReactNode; error?: string; help?: string }) {
  return <label className="block text-sm font-black">{label}<div className="mt-1">{children}</div>{help && <span className="mt-1 block text-xs font-medium text-stone-500">{help}</span>}{error && <span className="mt-1 block text-xs font-black text-red-700">{error}</span>}</label>;
}
