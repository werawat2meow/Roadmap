import { sidebarMenus as emsMenus } from "../(employee-master)/components/sidebarMenus";
// ⚠️ เช็ค path นี้ให้ตรงกับที่เก็บไฟล์ sidebarMenus.js จริงของคุณ

// EMS พิเศษ เพราะ path กระจายหลาย prefix ไม่ได้อยู่ใต้อันเดียว
const emsPrefixes = emsMenus.flatMap((g) => (g.items || []).map((i) => i.href));

// ระบบอื่นๆ ที่มี layout ของตัวเอง และ path เป็น /admin/{ชื่อระบบ}/... เพียว ๆ
// ⭐ อนาคตมีระบบใหม่ แค่เพิ่มชื่อในนี้บรรทัดเดียวพอ
const STANDALONE_SYSTEMS = [
  "benefit",
];

const standalonePrefixes = STANDALONE_SYSTEMS.map((name) => `/admin/${name}`);

export const NO_HEADER_PREFIXES = [
  ...emsPrefixes,
  ...standalonePrefixes,
];