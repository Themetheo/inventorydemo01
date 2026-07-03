export type MovementType = "RECEIVE" | "ISSUE" | "TRANSFER" | "WASTE" | "RETURN" | "ADJUSTMENT";

export const MOVEMENT_ACTIONS: ReadonlyArray<{ value: MovementType; label: string; code: string; description: string }> = [
  { value: "RECEIVE", label: "รับของเข้า", code: "IN", description: "เพิ่มของเข้าตำแหน่งจัดเก็บ" },
  { value: "ISSUE", label: "เบิกไปใช้", code: "OUT", description: "นำของออกจากสต๊อก" },
  { value: "WASTE", label: "ของเสีย", code: "LOSS", description: "ตัดของเสียออกจากยอด" },
  { value: "ADJUSTMENT", label: "ปรับยอด", code: "ADJ", description: "เพิ่มหรือลดยอดด้วยเหตุผล" },
  { value: "TRANSFER", label: "โอนย้าย", code: "MOVE", description: "ย้ายระหว่างตำแหน่ง" },
  { value: "RETURN", label: "คืนสินค้า", code: "BACK", description: "รับของคืนเข้าสต๊อก" },
];

export function adjustQuantity(current: number, delta: number, minimum = 0.01): number {
  const value = Number.isFinite(current) ? current : minimum;
  return Math.max(minimum, Math.round((value + delta) * 100) / 100);
}

export function movementLocationNeeds(type: MovementType, adjustmentDirection: "increase" | "decrease") {
  return {
    needsFrom: ["ISSUE", "TRANSFER", "WASTE"].includes(type) || (type === "ADJUSTMENT" && adjustmentDirection === "decrease"),
    needsTo: ["RECEIVE", "TRANSFER", "RETURN"].includes(type) || (type === "ADJUSTMENT" && adjustmentDirection === "increase"),
  };
}
