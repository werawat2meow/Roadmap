<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
## ขอบเขตการทำงาน

- โฟกัสที่ app/roadmap/ เป็นหลัก เว้นแต่ผู้ใช้ระบุงานส่วนอื่น
- ค้นหาและอ่านเฉพาะไฟล์ที่จำเป็นต่อคำขอ ไม่อ่านทั้งโปรเจกต์ล่วงหน้า
- อ่านไฟล์ส่วนกลาง เช่น lib/ และไฟล์ตั้งค่า เฉพาะที่ roadmap ใช้งานหรือเกี่ยวข้องกับงาน
- ไม่สำรวจโมดูลอื่นใน app/ หากไม่เกี่ยวข้องกับคำขอ
- ไม่ค้นกว้างใน .next/, dist/ และ node_modules/
- อ่านคู่มือที่เกี่ยวข้องใน node_modules/next/dist/docs/ ตามกฎ Next.js ด้านบน
