# การใส่รูปสินค้า

1. วางไฟล์รูปใน directory ของ Next.js app:

   ```text
   apps/web/public/images/items/
   ```

2. ตั้งชื่อไฟล์ด้วยตัวพิมพ์เล็กภาษาอังกฤษ ไม่มีเว้นวรรค และใช้ขีด `-` คั่นคำ

3. ตัวอย่างชื่อไฟล์:

   ```text
   red-pork.webp
   ```

4. ในหน้า `/settings/items` กรอก Image URL:

   ```text
   /images/items/red-pork.webp
   ```

5. Linux แยกตัวพิมพ์เล็กและตัวพิมพ์ใหญ่ ชื่อใน Image URL ต้องตรงกับชื่อไฟล์ทุกตัวอักษร

6. รองรับไฟล์ `webp`, `png`, `jpg` และ `jpeg` รวมถึง HTTPS URL ที่ลงท้ายด้วยนามสกุลเหล่านี้

7. การอัปโหลดรูปผ่านเว็บยังไม่รวมใน MVP นี้ เพราะ `public` directory เป็นส่วนหนึ่งของ repository ให้นำไฟล์เข้า repository ก่อน แล้วจึงตั้งค่า Image URL
