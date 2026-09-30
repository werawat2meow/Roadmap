import ExcelJS from 'exceljs';
import { candidateStatusLabel } from './candidateStatus.js';
import { bangkokReportDate } from './reportDate.mjs';

// Assign only primitive strings, never a formula/hyperlink object. ExcelJS writes
// even '='/'+'/'@' prefixes as string cells in XLSX (not CSV).
const text = value => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').slice(0, 32767);
function filenameDate(now) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const get = type => parts.find(part => part.type === type).value;
  return `${get('year')}${get('month')}${get('day')}_${get('hour')}${get('minute')}${get('second')}`;
}

export function buildSharingWorkbook(data, filters, { history = false, now = new Date() } = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Recruitment';
  workbook.created = now;
  const sheet = workbook.addWorksheet(history ? 'Applicants' : 'Summary');
  sheet.columns = (history ? [36, 32, 32, 36] : [32, 32, 48, 22]).map(width => ({ width }));
  const merged = (value, bold = false) => {
    const row = sheet.addRow([text(value)]);
    sheet.mergeCells(row.number, 1, row.number, 4);
    row.font = { name: 'Tahoma', size: bold ? 14 : 10, bold };
    row.alignment = { vertical: 'middle', wrapText: true };
    row.height = bold ? 30 : 32;
    return row;
  };
  merged(history ? 'History ผู้สมัครจากลิงก์' : 'รายงานการแชร์ประกาศงาน', true);
  merged(`วันที่ส่งออก: ${bangkokReportDate(now)} (Asia/Bangkok)`);
  merged(`วันที่สมัคร: ${filters.dateFrom || 'ไม่จำกัดวันเริ่มต้น'} ถึง ${filters.dateTo || 'ไม่จำกัดวันสิ้นสุด'} (เวลาไทย รวมวันสิ้นสุดทั้งวัน)`);
  if (history) {
    merged(`ผู้แชร์: ${data.link.user_name} | ตำแหน่ง: ${data.link.position_name}`);
    merged(`บริษัท/สาขา: ${data.link.company_name} / ${data.link.branch_name}`);
    merged(`ชื่อผู้สมัคร: ${filters.keyword || 'ทั้งหมด'} | สถานะ: ${filters.status === null ? 'ทั้งหมด' : candidateStatusLabel(filters.status)}`);
  } else {
    const label = (options, id) => id ? (options.find(option => option.value === id)?.label || 'ไม่พบในขอบเขตสิทธิ์') : 'ทั้งหมด';
    merged(`ผู้แชร์: ${label(data.options.users, filters.userId)} | ตำแหน่ง: ${label(data.options.positions, filters.positionId)}`);
  }
  merged(`จำนวนรายการ: ${data.rows.length.toLocaleString('th-TH')}${history ? '' : ` | รวมใบสมัคร: ${data.rows.reduce((sum, row) => sum + row.application_count, 0).toLocaleString('th-TH')}`}`);
  sheet.addRow([]);
  const header = sheet.addRow(history
    ? ['ชื่อ–นามสกุล', 'วันที่สมัคร (เวลาไทย)', 'ตำแหน่ง', 'สถานะปัจจุบัน']
    : ['ผู้แชร์', 'ตำแหน่ง', 'บริษัท/สาขา', 'จำนวนใบสมัคร']);
  header.height = 30;
  header.eachCell(cell => {
    cell.font = { name: 'Tahoma', bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF123A63' } };
    cell.alignment = { vertical: 'middle', wrapText: true };
  });
  for (const [index, item] of data.rows.entries()) {
    const values = history
      ? [text([item.first_name, item.last_name].filter(Boolean).join(' ') || '-'), text(bangkokReportDate(item.created_at)), text(data.link.position_name), text(candidateStatusLabel(item.status))]
      : [text(item.user_name), text(item.position_name), text(`${item.company_name} / ${item.branch_name}`), item.application_count];
    const row = sheet.addRow(values);
    row.height = 40;
    row.eachCell(cell => {
      cell.font = { name: 'Tahoma', size: 11 };
      cell.alignment = { vertical: 'middle', wrapText: true };
      if (index % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F5FA' } };
      if (typeof cell.value === 'string') cell.numFmt = '@';
    });
    if (!history) { row.getCell(4).numFmt = '#,##0'; row.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' }; }
  }
  sheet.autoFilter = { from: { row: header.number, column: 1 }, to: { row: header.number + data.rows.length, column: 4 } };
  if (!data.rows.length) merged('ไม่พบข้อมูลตามตัวกรอง');
  sheet.views = [{ state: 'frozen', ySplit: header.number, showGridLines: false }];
  sheet.pageSetup = { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: `${header.number}:${header.number}` };
  return { workbook, filename: `job-sharing-${history ? 'history' : 'summary'}_${filenameDate(now)}.xlsx` };
}
