"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ErrorBox } from "@/components/page-kit";
import { post } from "@/lib/api";
import type { SessionUser } from "@/lib/types";

const schema = z.object({ username: z.string().trim().min(1, "กรุณากรอกชื่อผู้ใช้"), password: z.string().min(1, "กรุณากรอกรหัสผ่าน") }); type Form = z.infer<typeof schema>;
export default function LoginPage() {
  const router = useRouter(); const client = useQueryClient(); const form = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { username: "", password: "" } });
  const login = useMutation({ mutationFn: (values: Form) => post<SessionUser>("/auth/login", values), onSuccess: (user) => { client.setQueryData(["me"], user); router.replace("/dashboard"); } });
  return <main className="request-market grid min-h-screen bg-[#fff2bd] text-[#18130f] lg:grid-cols-[minmax(320px,.9fr)_minmax(440px,1.1fr)]">
    <section className="relative hidden overflow-hidden border-r-2 border-black bg-[#18130f] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
      <div><p className="font-mono text-xs font-black tracking-[.24em] text-amber-200">RESTAURANT INVENTORY</p><h1 className="mt-5 max-w-lg text-6xl font-black leading-[.92] tracking-tight xl:text-7xl">STOCK<br/><span className="text-red-500">MARKET</span></h1><p className="mt-6 max-w-sm text-base text-stone-300">จัดการคลัง เลือกสินค้า และส่งของให้ทุกโซนในร้านจากจุดเดียว</p></div>
      <div className="grid max-w-md grid-cols-4 gap-2" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <span key={index} className={`aspect-square border-2 border-white ${[1, 4, 6, 11].includes(index) ? "bg-red-600" : "bg-amber-100"}`} />)}</div>
      <p className="font-mono text-[10px] tracking-[.2em] text-stone-500">PRESS START · MARKET SYSTEM 01</p>
    </section>
    <section className="grid place-items-center p-4 sm:p-8">
      <div className="market-entrance w-full max-w-md">
        <div className="market-awning mb-5 h-3 border-2 border-black shadow-[4px_4px_0_#18130f]" aria-hidden="true" />
        <form className="border-2 border-black bg-[#fffdf4] p-6 shadow-[8px_8px_0_#18130f] sm:p-8" onSubmit={form.handleSubmit((v) => login.mutate(v))}>
          <div className="mb-7 flex items-center gap-4 border-b-2 border-black pb-5"><span className="grid h-16 w-16 shrink-0 place-items-center border-2 border-black bg-red-600 font-mono text-xl font-black text-white shadow-[3px_3px_0_#18130f]">P1</span><div><p className="font-mono text-[10px] font-black tracking-[.2em] text-red-700">PLAYER LOGIN</p><h2 className="mt-1 text-3xl font-black">เข้าสู่ตลาดสต๊อก</h2></div></div>
          <label className="block text-sm font-black">ชื่อผู้ใช้<input autoComplete="username" className="field mt-2" {...form.register("username")} /></label>
          <label className="mt-4 block text-sm font-black">รหัสผ่าน<input autoComplete="current-password" type="password" className="field mt-2" {...form.register("password")} /></label>
          {(form.formState.errors.username || form.formState.errors.password) && <div role="alert" className="mt-4 border-2 border-red-700 bg-red-50 p-3 text-sm font-black text-red-900 shadow-[3px_3px_0_#d62b20]">{form.formState.errors.username?.message || form.formState.errors.password?.message}</div>}
          {login.error && <div className="mt-4"><ErrorBox error={login.error} /></div>}
          <button className="btn-primary mt-6 w-full" disabled={login.isPending}>{login.isPending ? "กำลังเข้าสู่ตลาด..." : "เริ่มใช้งาน →"}</button>
          <p className="mt-5 text-center font-mono text-[9px] font-bold tracking-[.18em] text-stone-400">AUTHORIZED STAFF ONLY</p>
        </form>
      </div>
    </section>
  </main>;
}
