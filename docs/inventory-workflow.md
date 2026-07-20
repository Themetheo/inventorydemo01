# โฟลวการทำงานของระบบจัดการสต๊อก

ระบบนี้เป็นระบบจัดการสต๊อกสำหรับร้านอาหาร โดยมีโฟลวหลักดังนี้

```text
ตั้งค่าข้อมูลสินค้า
      ↓
รับสินค้าเข้าคลัง
      ↓
พนักงานส่งคำขอเบิก
      ↓
คลังอนุมัติและจ่ายสินค้า
      ↓
ยอดคงเหลือถูกอัปเดต
      ↓
ตรวจนับและปรับยอดจริง
```

## 1. เข้าสู่ระบบและกำหนดสิทธิ์

หลังผู้ใช้เข้าสู่ระบบ ระบบจะเก็บ JWT ใน httpOnly cookie และตรวจสอบสิทธิ์ตามบทบาทของผู้ใช้

- `owner`: ใช้งานได้ทุกส่วน รวมถึง rebuild ยอดสต๊อก
- `manager`: ตั้งค่าข้อมูลและจัดการงานสต๊อกทั้งหมด ยกเว้น rebuild
- `stock`: รับเข้า เคลื่อนไหว จ่ายสินค้า นับสต๊อก และดูยอดคงเหลือ
- `staff`: เลือกสินค้า สร้างคำขอ ดูสถานะ และยกเลิกคำขอของตัวเอง

API ตรวจสอบทั้งบทบาทและสาขาทุกครั้ง การซ่อนเมนูในหน้าเว็บไม่ใช่ขอบเขตด้านความปลอดภัย

## 2. ตั้งค่าข้อมูลเริ่มต้น

ก่อนเริ่มทำรายการสต๊อก Owner หรือ Manager ต้องตั้งค่าข้อมูลต่อไปนี้

### ข้อมูลสินค้า

หน้า `/settings/items` ใช้สร้างและแก้ไขข้อมูลกลางของสินค้า ได้แก่

- ชื่อสินค้า
- หมวดหมู่
- หน่วยนับ
- รูปสินค้า
- รายละเอียด
- สถานะเปิดใช้งาน

### ตำแหน่งจัดเก็บ

หน้า `/settings/locations` ใช้กำหนดพื้นที่จัดเก็บของสาขา เช่น

- `WAREHOUSE`: คลังสินค้า
- `FRIDGE`: ตู้เย็น
- `KITCHEN`: ครัว
- `COUNTER`: เคาน์เตอร์
- `STORAGE`: พื้นที่จัดเก็บทั่วไป

### ไอเทมประจำสาขา

หน้า `/settings/store-items` ใช้เลือกว่าสาขานั้นใช้งานสินค้าใด พร้อมกำหนด

- จำนวนขั้นต่ำ (`Min Qty`)
- จำนวนเป้าหมาย (`Target Qty`)
- ตำแหน่งปลายทางเริ่มต้น
- อนุญาตให้พนักงานเบิกหรือไม่
- ต้องนับสต๊อกทุกวันหรือไม่
- สถานะเปิดใช้งานในสาขา

ข้อมูลส่วนนี้ถูกใช้ในการแสดงสินค้าให้เบิก ตรวจสินค้าต่ำกว่าขั้นต่ำ และเลือกสินค้าในงานนับสต๊อก

## 3. รับสินค้าและเคลื่อนไหวสต๊อก

หน้า `/inventory/movements` รองรับรายการเคลื่อนไหวดังนี้

| ประเภท | การทำงาน |
| --- | --- |
| `RECEIVE` | รับสินค้าเข้าตำแหน่งปลายทาง |
| `ISSUE` | ตัดสินค้าออกจากตำแหน่งต้นทาง |
| `TRANSFER` | ย้ายสินค้าระหว่างตำแหน่ง |
| `WASTE` | ตัดสินค้าเสียออกจากสต๊อก |
| `RETURN` | รับสินค้าคืนเข้าตำแหน่ง |
| `ADJUSTMENT` | ปรับเพิ่มหรือลดยอดสินค้า |

เมื่อบันทึกรายการ ระบบจะสร้างข้อมูลใน `Stock_Movements` และอัปเดต `Stock_Balances` ตามตำแหน่งต้นทางและปลายทาง

ระบบจะไม่อนุญาตให้จ่ายหรือย้ายสินค้าเกินยอดคงเหลือ ยกเว้น Owner ใช้สิทธิ์ override พร้อมระบุเหตุผล

## 4. พนักงานส่งคำขอเบิก

หน้า `/inventory/request` มีขั้นตอนดังนี้

1. ระบบแสดงเฉพาะสินค้าที่เปิดใช้งานและอนุญาตให้เบิก
2. ผู้ใช้ค้นหาหรือเลือกสินค้าตามหมวดหมู่
3. เพิ่มสินค้าลงรถเข็น
4. ระบุจำนวนและหมายเหตุของแต่ละรายการ
5. ระบุหมายเหตุรวมของคำขอ หากมี
6. กดส่งคำขอเบิก
7. ระบบสร้าง `Stock_Request` และ `Stock_Request_Items`
8. คำขอเริ่มต้นด้วยสถานะ `PENDING`
9. ระบบพาไปยังหน้ารายละเอียดคำขอ

Frontend ส่ง Idempotency Key ไปกับคำขอ เพื่อป้องกันการกดส่งซ้ำแล้วสร้างคำขอซ้ำ

## 5. คลังอนุมัติและจ่ายสินค้า

Stock หรือ Manager เปิดคิวงานที่หน้า `/inventory/stockroom` หรือเปิดรายละเอียดจากหน้า `/inventory/requests`

ผู้จัดการสต๊อกสามารถ

- อนุมัติเต็มจำนวน
- อนุมัติบางส่วน
- ปฏิเสธคำขอ
- จ่ายสินค้าเต็มจำนวน
- ทยอยจ่ายสินค้า
- ใช้คำสั่งจ่ายด่วนเต็มจำนวน

เมื่อจ่ายสินค้า ระบบจะทำงานดังนี้

1. ใช้ตำแหน่งประเภท `WAREHOUSE` เป็นคลังต้นทาง หากผู้ใช้ไม่ได้เลือกเอง
2. ใช้ Default Location ของไอเทมสาขาเป็นปลายทาง หากไม่ได้ระบุเอง
3. ตรวจสอบว่าสต๊อกต้นทางเพียงพอ
4. สร้าง Movement ประเภท `TRANSFER`
5. ลดยอดจากตำแหน่งต้นทาง
6. เพิ่มยอดในตำแหน่งปลายทาง
7. อัปเดตยอดที่จ่ายของแต่ละรายการ
8. เปลี่ยนสถานะคำขอเป็น `PARTIAL` หรือ `COMPLETED`

โฟลวสถานะคำขอเป็นดังนี้

```text
PENDING → APPROVED → PARTIAL → COMPLETED
    ├──────────────→ REJECTED
    └──────────────→ CANCELLED
```

คำสั่งจ่ายด่วนจะอนุมัติคำขอที่ยังเป็น `PENDING` เต็มจำนวน และพยายามจ่ายยอดที่เหลือทั้งหมด การทำงานจะสำเร็จเมื่อมีคลังต้นทาง ตำแหน่งปลายทาง และยอดสต๊อกเพียงพอ

## 6. ตรวจสอบยอดคงเหลือ

หน้า `/inventory/balances` แสดงยอดสินค้าแยกตามสินค้าและตำแหน่งจัดเก็บ พร้อมสถานะเทียบกับจำนวนขั้นต่ำของสาขา

Dashboard แสดงข้อมูลสรุป ได้แก่

- จำนวนคำขอที่ยังรอดำเนินการ
- จำนวนสินค้าที่ต่ำกว่าขั้นต่ำ
- จำนวนรายการที่ต้องนับสต๊อก

การตรวจ Low Stock ใช้ยอดรวมของสินค้าในทุกตำแหน่งของสาขาเทียบกับ `Min Qty` ปัจจุบันระบบยังไม่ได้สร้างคำสั่งเติมสินค้าอัตโนมัติ

## 7. นับสต๊อกและปรับยอด

หน้า `/inventory/count` ใช้ตรวจนับสินค้าจริงในแต่ละตำแหน่ง

1. เลือกตำแหน่งที่ต้องการนับ
2. ระบบแสดงสินค้าที่กำหนดให้ต้องนับ
3. กรอกจำนวนที่ตรวจนับได้จริง
4. เลือกบันทึกเป็น `DRAFT` หรือ `COMPLETED`

ผลของแต่ละสถานะคือ

- `DRAFT`: เก็บผลการนับ แต่ยังไม่เปลี่ยนยอดสต๊อก
- `COMPLETED`: คำนวณส่วนต่างและปรับยอดสต๊อก

สูตรคำนวณส่วนต่างคือ

```text
Variance = ยอดที่นับได้จริง - ยอดในระบบ
```

ถ้าส่วนต่างไม่เท่ากับศูนย์ ระบบจะสร้าง Movement ประเภท `ADJUSTMENT` และอัปเดต `Stock_Balances`

### ใบนับสต๊อกแบบกระดาษ + OCR

หน้า `/inventory/count/paper` ใช้สร้างใบนับ A4 สำหรับพิมพ์ โดยเลือกตำแหน่ง รอบนับ หมวดหมู่
ตัวกรอง `Require_Daily_Count` และรายการสินค้าที่ต้องการนับ ระบบสร้าง `Document_Code`
รูปแบบ `CNT-YYYYMMDD-001` และบันทึก count เป็น `DRAFT` แหล่งข้อมูล `PAPER_OCR`

เอกสารพิมพ์มี row number, item ID, item name, unit, ช่องเขียนจำนวน และ note แต่ไม่พิมพ์
`systemQty` เพื่อไม่ให้ผู้ตรวจนับลำเอียงและไม่ให้ OCR สับสน

หน้า `/inventory/count/scan` รับ JPG, JPEG, PNG, WebP และ PDF ขนาดไม่เกิน 25 MB ต่อไฟล์
พร้อม preview และ duplicate-file guard ใน browser จากนั้นเรียก backend OCR endpoint

OCR phase now sends uploaded file content from `/inventory/count/scan` to the
backend OCR endpoint. `InventoryService.processCountOcr` delegates to
`apps/api/src/services/count-ocr-provider.ts`; runtime OCR requires
`TYPHOON_API_KEY`/`TYPHOON_OCR_API_KEY` and always uses Typhoon. The mock
provider is limited to `NODE_ENV=test`.

Multi-page PDF OCR depends on the provider being able to see every page in the
single uploaded PDF. The current app does not rasterize PDF pages before OCR, so
uploading one image file per page is the reliable multi-page path.

```text
Uploaded document metadata + base64 content
      ↓
Backend OCR provider (Typhoon in runtime; mock only in tests)
      ↓
Stock_Count_Items rowNumber + OCR_Raw_Value + OCR_Confidence + Review_Status
      ↓
Human review
      ↓
Draft or complete
```

กฎ review:

- confidence ต่ำกว่า 0.8 เป็น `NEEDS_REVIEW`
- อ่านไม่ได้เป็น `UNREAD`
- ระบบไม่ใช้ `systemQty` เป็น fallback
- `countedQty` เริ่มต้นเป็นค่าว่างสำหรับ paper count
- ต้องยืนยันทุก row เป็น `CONFIRMED` ก่อน complete
- backend ไม่รับจำนวนติดลบ

เมื่อกด complete ระบบตรวจว่า count ยังไม่ completed และตรวจ movement อ้างอิง count เดิมก่อนสร้าง
`ADJUSTMENT` เพื่อกันการกดยืนยันซ้ำในระดับ service แม้ Google Sheets จะยังไม่มี transaction จริง

## การไหลของข้อมูลภายในระบบ

```text
Next.js Web
   ↓ REST API
Fastify Route
   ↓
InventoryService
   ↓
InventoryRepository
   ↓
Google Sheets
```

Google Sheets เป็นที่เก็บข้อมูลหลัก โดยมีแท็บสำคัญ ได้แก่

- `Users`
- `Branches`
- `Categories`
- `Items`
- `Store_Items`
- `Locations`
- `Stock_Balances`
- `Stock_Movements`
- `Stock_Requests`
- `Stock_Request_Items`
- `Stock_Counts`
- `Stock_Count_Items`

Paper/OCR workflow เพิ่มคอลัมน์ท้ายตารางใน `Stock_Counts`: `Source`, `Document_Code`,
`OCR_Status`, `Original_Image_URL`, `OCR_Confidence`, `Printed_At`, `Uploaded_At`,
`Reviewed_By`, `Reviewed_At`, `Completed_By`, `Completed_At`

และเพิ่มคอลัมน์ท้ายตารางใน `Stock_Count_Items`: `Row_Number`, `OCR_Raw_Value`,
`OCR_Confidence`, `Review_Status`, `Reviewed_Qty`

`Stock_Movements` เป็นประวัติหลักหรือ source of truth ส่วน `Stock_Balances` เป็นยอดคงเหลือที่คำนวณไว้เพื่อให้หน้าเว็บอ่านได้รวดเร็ว

Owner สามารถเรียก API สำหรับ rebuild `Stock_Balances` จากประวัติ Movement ได้ หากยอดคงเหลือไม่ตรงกับประวัติ

## ข้อจำกัดปัจจุบัน

- Google Sheets ไม่มี transaction แบบฐานข้อมูล
- การแก้ไขพร้อมกันหลายคนอาจเกิด lost update
- การบันทึก Movement และ Balance ไม่ได้ atomic เทียบเท่าฐานข้อมูลจริง
- ระบบรูปสินค้ารองรับ URL หรือ local path แต่ยังไม่มีระบบอัปโหลดไฟล์
- Memory cache จะถูกล้างเมื่อ API process restart
- เหมาะกับระบบภายในหรือ MVP มากกว่าระบบสต๊อก production ขนาดใหญ่
