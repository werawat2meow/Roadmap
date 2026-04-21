/*
บัญชีผู้ใช้และสิทธิ์
  ใช้จัดการบัญชีผู้ใช้ของระบบ
    - จริง ๆ เส้นนี้โยงไปใช้ของ /api/admin/user-accounts
    - รองรับ GET และ POST
    - GET = ดึงรายการผู้ใช้งาน
    - POST = เพิ่มบัญชีผู้ใช้งาน
    - เหมาะกับระบบ Login, Permission, Access Control
    - ตอนนี้ยังไม่ได้ใส่ validateApiKey เพราะ export มาจาก admin route ตรง ๆ
    - ถ้าจะเปิดให้ระบบอื่นเรียกจริง ควรแยกไฟล์ใหม่แล้วใส่ validateApiKey
    
GET : http://localhost:3000/api/access/user-accounts?search=admin
*/
export { GET, POST } from "@/app/api/admin/user-accounts/route";