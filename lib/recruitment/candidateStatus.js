// Shared labels from CandidateDetail, plus resume-update status from Candidate list.
export const candidateStatusText = {
  0: 'ยกเลิก', 1: 'รอพิจารณา', 2: 'HRD ส่งต่อ HRM', 3: 'ผ่านการคัดเลือกเข้าสัมภาษณ์',
  4: 'นัดสัมภาษณ์', 5: 'ยืนยันการสัมภาษณ์', 6: 'เลื่อนการสัมภาษณ์', 7: 'ขาดการสัมภาษณ์',
  8: 'ส่งต่อการสัมภาษณ์', 9: 'ต้นสังกัดปล่อยให้ใช้ข้อมูลร่วมกัน', 10: 'ผ่านการคัดเลือก',
  11: 'ไม่ผ่านการคัดเลือก', 12: 'นัดวันเริ่มทำงาน', 13: 'เลื่อนวันเริ่มทำงาน',
  14: 'ไม่มาทำงานตามนัด', 15: 'อัพเดตเข้าฐานข้อมูลกลาง', 16: 'ยื่น Resume',
  17: 'รอเริ่มงาน', 18: 'รออัปเดตข้อมูล resume', 19: 'รอพิจารณาอีกครั้ง', 99: 'backlist',
};
export function candidateStatusLabel(status) {
  return candidateStatusText[status] || (status === null || status === undefined ? 'ไม่ระบุสถานะ' : `สถานะ ${status}`);
}
