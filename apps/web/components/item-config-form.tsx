"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ItemImage } from "@/components/item-image";
import { ErrorBox, PageHeader } from "@/components/page-kit";
import { get, patch, post } from "@/lib/api";
import { isValidItemImageInput } from "@/lib/image-url";
import type { Category, Item, SessionUser } from "@/lib/types";

const itemFormSchema = z.object({
  itemName: z.string().trim().min(1, "กรุณากรอกชื่อสินค้า"),
  categoryId: z.string().trim().min(1, "กรุณาเลือกหมวดหมู่"),
  unit: z.string().trim().min(1, "กรุณากรอกหน่วย"),
  imageUrl: z.string().refine(isValidItemImageInput, "ใช้ path ที่ขึ้นต้นด้วย / หรือ HTTPS URL ของไฟล์ webp, png, jpg, jpeg"),
  description: z.string(),
  isActive: z.boolean(),
});
type ItemForm = z.infer<typeof itemFormSchema>;

export function ItemConfigForm({ item }: { item?: Item }) {
  const router = useRouter();
  const client = useQueryClient();
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => get<Category[]>("/categories") });
  const me = useQuery({ queryKey: ["me"], queryFn: () => get<SessionUser>("/auth/me"), retry: false });
  const form = useForm<ItemForm>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: item ? { itemName: item.itemName, categoryId: item.categoryId, unit: item.unit, imageUrl: item.imageUrl, description: item.description, isActive: item.isActive } : { itemName: "", categoryId: "", unit: "", imageUrl: "", description: "", isActive: true },
  });
  const save = useMutation({
    mutationFn: (value: ItemForm) => item ? patch<Item>(`/items/${item.itemId}`, value) : post<Item>("/items", value),
    onSuccess: async (savedItem) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["items"] }),
        client.invalidateQueries({ queryKey: ["requestable-items"] }),
      ]);
      sessionStorage.setItem("item-config-success", `${item ? "บันทึกการแก้ไข" : "เพิ่ม"} ${savedItem.itemName} เรียบร้อยแล้ว`);
      router.replace("/settings/items");
    },
  });
  const submit = (value: ItemForm) => {
    if (save.isPending) return;
    save.mutate({
      ...value,
      itemName: value.itemName.trim(),
      categoryId: value.categoryId.trim(),
      unit: value.unit.trim(),
      imageUrl: value.imageUrl.trim(),
      description: value.description.trim(),
    });
  };
  const previewUrl = form.watch("imageUrl");
  const previewName = form.watch("itemName") || item?.itemName || "สินค้า";

  if (me.isLoading) return <div className="panel animate-pulse p-8"><div className="h-6 w-40 bg-stone-200"/><div className="mt-4 h-40 bg-stone-200"/></div>;
  if (me.data && me.data.role !== "owner" && me.data.role !== "manager") return <div className="border-2 border-black bg-white p-8 text-center shadow-[5px_5px_0_#d62b20]"><p className="font-black">บัญชีนี้ไม่มีสิทธิ์แก้ไขข้อมูลไอเทม</p><Link href="/settings/items" className="btn-secondary mt-5 inline-flex">กลับรายการไอเทม</Link></div>;

  return <>
    <PageHeader eyebrow={item ? "Edit Item · Master Data" : "New Item · Master Data"} title={item ? "แก้ไขไอเทม" : "เพิ่มไอเทม"} description={item ? "แก้ข้อมูลกลางและรูปสินค้า แล้วบันทึกกลับไปยัง Items" : "สร้างข้อมูลกลางของสินค้าใหม่ใน Items"} actions={<Link href="/settings/items" className="btn-secondary inline-flex items-center">← กลับรายการไอเทม</Link>} />
    <form onSubmit={form.handleSubmit(submit)} className="grid gap-7 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="h-fit">
        <p className="mb-2 font-mono text-[10px] font-black tracking-[.2em] text-red-700">IMAGE PREVIEW</p>
        <div className="border-2 border-black bg-white p-4 shadow-[6px_6px_0_#18130f]"><ItemImage src={previewUrl} itemName={previewName} className="w-full" /></div>
        <div className="mt-5 border-2 border-black bg-amber-100 p-4 text-xs leading-relaxed shadow-[4px_4px_0_#18130f]">
          <p className="font-black">วางไฟล์ไว้ใน:</p><code className="mt-1 block break-all">apps/web/public/images/items/</code>
          <p className="mt-3 font-black">แล้วกรอก:</p><code className="mt-1 block break-all">/images/items/red-pork.webp</code>
        </div>
      </aside>
      <section className="border-2 border-black bg-[#fffdf4] p-5 shadow-[6px_6px_0_#d62b20] sm:p-6">
        {item && <Field label="Item ID"><input className="field bg-stone-100 font-mono" value={item.itemId} readOnly aria-readonly="true" /></Field>}
        <div className={item ? "mt-5" : ""}><Field label="ชื่อสินค้า" error={form.formState.errors.itemName?.message}><input className="field" autoFocus {...form.register("itemName")} /></Field></div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="หมวดหมู่" error={form.formState.errors.categoryId?.message}><select className="field" {...form.register("categoryId")}><option value="">เลือกหมวดหมู่</option>{categories.data?.filter((value) => value.categoryId && value.categoryName).map((value, index) => <option key={`category-${value.categoryId}-${index}`} value={value.categoryId}>{value.categoryName}</option>)}</select></Field>
          <Field label="หน่วย" error={form.formState.errors.unit?.message}><input className="field" placeholder="เช่น กก., ชิ้น, ขวด" {...form.register("unit")} /></Field>
        </div>
        <div className="mt-5"><Field label="Image URL" error={form.formState.errors.imageUrl?.message} help="รองรับ local path ที่ขึ้นต้นด้วย / และ full HTTPS URL">
          <div className="flex flex-col gap-2 sm:flex-row"><input className="field min-w-0 flex-1" placeholder="/images/items/red-pork.webp" {...form.register("imageUrl")} /><button type="button" className="btn-secondary shrink-0" onClick={() => form.setValue("imageUrl", "", { shouldDirty: true, shouldValidate: true })}>ล้างรูป</button></div>
        </Field></div>
        <div className="mt-5"><Field label="คำอธิบาย"><textarea className="field min-h-28 resize-y" {...form.register("description")} /></Field></div>
        <label className="mt-5 flex min-h-12 items-center gap-3 border-2 border-black bg-amber-100 px-4 text-sm font-black"><input type="checkbox" {...form.register("isActive")} /> เปิดใช้งาน</label>
        {save.error && <div className="mt-5"><ErrorBox error={save.error} /></div>}
        <div className="mt-6 flex flex-col-reverse gap-3 border-t-2 border-black pt-5 sm:flex-row sm:justify-end"><Link href="/settings/items" className="btn-secondary inline-flex items-center justify-center">ยกเลิก</Link><button className="btn-primary" disabled={save.isPending}>{save.isPending ? "กำลังบันทึก..." : item ? "บันทึกการแก้ไข" : "เพิ่มไอเทม"}</button></div>
      </section>
    </form>
  </>;
}

function Field({ label, children, error, help }: { label: string; children: React.ReactNode; error?: string; help?: string }) {
  return <label className="block text-sm font-black">{label}<div className="mt-1.5">{children}</div>{help && <span className="mt-1.5 block text-xs font-medium text-stone-500">{help}</span>}{error && <span className="mt-1.5 block text-xs font-black text-red-700">{error}</span>}</label>;
}
