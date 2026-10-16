export const REPORT_MODULE = 'recruitment.candidate';
export class ReportError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function requireReportId(value) {
  if (!uuid.test(value || '')) throw new ReportError('รหัสอ้างอิงไม่ถูกต้อง');
  return value;
}
function dateBoundary(value, nextDay = false) {
  if (!value) return null;
  const utc = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(utc.getTime()) || utc.toISOString().slice(0, 10) !== value) {
    throw new ReportError('วันที่ไม่ถูกต้อง');
  }
  return new Date(utc.getTime() - 7 * 3600000 + (nextDay ? 86400000 : 0)).toISOString();
}
export function parseReportFilters(params) {
  const dateFrom = params.get('dateFrom') || '';
  const dateTo = params.get('dateTo') || '';
  const from = dateBoundary(dateFrom), until = dateBoundary(dateTo, true);
  if (dateFrom && dateTo && dateFrom > dateTo) throw new ReportError('วันเริ่มต้นต้องไม่เกินวันสิ้นสุด');
  const integer = (name, fallback, max) => {
    const value = params.get(name);
    if (!value) return fallback;
    if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > max) throw new ReportError(`${name} ไม่ถูกต้อง`);
    return Number(value);
  };
  const userId = params.get('userId') || '', positionId = params.get('positionId') || '';
  if (userId) requireReportId(userId);
  if (positionId) requireReportId(positionId);
  const rawStatus = params.get('status');
  if (rawStatus && (!/^\d+$/.test(rawStatus) || Number(rawStatus) > 32767)) throw new ReportError('สถานะไม่ถูกต้อง');
  const keyword = (params.get('keyword') || '').trim();
  if (keyword.length > 100) throw new ReportError('คำค้นยาวเกิน 100 ตัวอักษร');
  return { dateFrom, dateTo, from, until, userId, positionId, keyword,
    status: rawStatus === null || rawStatus === '' ? null : Number(rawStatus),
    page: integer('page', 1, 1000000), pageSize: integer('pageSize', 20, 100) };
}

// Advance by rows actually returned, not requested size (Supabase may cap it).
export async function readReportRows(queryFactory, offset = 0, limit = Infinity, expectedCount = null) {
  const rows = [];
  let total = expectedCount;
  while (rows.length < limit) {
    const start = offset + rows.length;
    const { data, error, count } = await queryFactory().range(start, start + Math.min(200, limit - rows.length) - 1);
    if (error) throw error;
    if (typeof count === 'number') {
      if (total !== null && total !== count) throw new ReportError('ข้อมูลรายงานเปลี่ยนระหว่างโหลด กรุณาลองอีกครั้ง', 409);
      total = count;
    }
    if (!data?.length) {
      if (total !== null && start < total) throw new ReportError('ได้รับข้อมูลรายงานไม่ครบ กรุณาลองอีกครั้ง', 503);
      break;
    }
    rows.push(...data);
    if (typeof count === 'number' && offset + rows.length >= count) break;
  }
  return rows;
}
async function byIds(db, table, columns, ids) {
  const unique = [...new Set(ids.filter(Boolean))], rows = [];
  for (let i = 0; i < unique.length; i += 100) {
    rows.push(...await readReportRows(() => db.from(table).select(columns, { count: 'exact' }).in('id', unique.slice(i, i + 100)).order('id')));
  }
  return new Map(rows.map(row => [row.id, row]));
}

export async function getReportLinks(db, guard, filters, shareLinkId = null) {
  // Scope is applied to the original opening, before any sharer/options are read.
  const openings = await readReportRows(() => guard.applyEmployeeScope(db.from('recruit_job_open')
    .select('id,position_id,branch_id,department_id,division_id,unit_id', { count: 'exact' })).order('id'));
  const openingMap = new Map(openings.map(row => [row.id, row]));
  const links = [];
  for (let i = 0; i < openings.length; i += 100) {
    links.push(...await readReportRows(() => {
      let query = db.from('recruit_job_open_share_links')
        .select('id,job_open_id,shared_by_user_account_id,created_at', { count: 'exact' })
        .in('job_open_id', openings.slice(i, i + 100).map(row => row.id));
      if (shareLinkId) query = query.eq('id', shareLinkId);
      return query.order('id');
    }));
  }
  if (shareLinkId && !links.length) throw new ReportError('ไม่พบรายการหรือไม่มีสิทธิ์เข้าถึง', 404);
  const [users, positions, branches] = await Promise.all([
    byIds(db, 'user_accounts', 'id,username,employee_id', links.map(row => row.shared_by_user_account_id)),
    byIds(db, 'positions', 'id,position_name', links.map(row => openingMap.get(row.job_open_id)?.position_id)),
    byIds(db, 'branches', 'id,branch_name,company_id', links.map(row => openingMap.get(row.job_open_id)?.branch_id)),
  ]);
  const [employees, companies] = await Promise.all([
    byIds(db, 'employees', 'id,first_name_th,last_name_th', [...users.values()].map(row => row.employee_id)),
    byIds(db, 'companies', 'id,company_name_th,company_name_en', [...branches.values()].map(row => row.company_id)),
  ]);
  const all = links.map(link => {
    const opening = openingMap.get(link.job_open_id), user = users.get(link.shared_by_user_account_id);
    const employee = employees.get(user?.employee_id), branch = branches.get(opening.branch_id);
    const company = companies.get(branch?.company_id);
    return { id: link.id, job_open_id: link.job_open_id, user_id: link.shared_by_user_account_id,
      user_name: [employee?.first_name_th, employee?.last_name_th].filter(Boolean).join(' ').trim() || user?.username || '-',
      position_id: opening.position_id, position_name: positions.get(opening.position_id)?.position_name || '-',
      company_name: company?.company_name_th || company?.company_name_en || '-', branch_name: branch?.branch_name || '-' };
  }).sort((a, b) => a.user_name.localeCompare(b.user_name, 'th') || a.position_name.localeCompare(b.position_name, 'th') || a.id.localeCompare(b.id));
  const options = (id, label) => [...new Map(all.map(row => [row[id], { value: row[id], label: row[label] }])).values()];
  return { links: all.filter(row => (!filters.userId || row.user_id === filters.userId) && (!filters.positionId || row.position_id === filters.positionId)),
    options: { users: options('user_id', 'user_name'), positions: options('position_id', 'position_name') } };
}

export function applicationReportQuery(db, shareLinkId, filters, { head = false, history = false } = {}) {
  let query = db.from('recruit_job_applications')
    .select(head ? 'id' : 'id,first_name,last_name,created_at,status', { count: 'exact', head })
    .eq('share_link_id', shareLinkId);
  if (filters.from) query = query.gte('created_at', filters.from);
  if (filters.until) query = query.lt('created_at', filters.until);
  if (history && filters.status !== null) query = query.eq('status', filters.status);
  if (history && filters.keyword) {
    // AND words across first/last name; eliminate PostgREST filter syntax.
    const words = filters.keyword.replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean);
    if (!words.length) query = query.eq('id', '00000000-0000-0000-0000-000000000000');
    for (const word of words) query = query.or(`first_name.ilike.%${word}%,last_name.ilike.%${word}%`);
  }
  return query;
}

export async function getSharingSummary(db, guard, filters, { all = false } = {}) {
  const { links, options } = await getReportLinks(db, guard, filters);
  const selected = all ? links : links.slice((filters.page - 1) * filters.pageSize, filters.page * filters.pageSize);
  const rows = [];
  // Bounded concurrency. COUNT(id) == COUNT(DISTINCT id) because id is the PK,
  // and this count query has no joins. No applicant rows are downloaded to count.
  for (let i = 0; i < selected.length; i += 8) {
    rows.push(...await Promise.all(selected.slice(i, i + 8).map(async link => {
      const { count, error } = await applicationReportQuery(db, link.id, filters, { head: true });
      if (error) throw error;
      if (typeof count !== 'number') throw new Error('Missing exact application count');
      return { ...link, application_count: count };
    })));
  }
  return { rows, total: links.length, options, page: filters.page, pageSize: filters.pageSize };
}

export async function getSharingHistory(db, guard, shareLinkId, filters, { all = false } = {}) {
  requireReportId(shareLinkId);
  const { links } = await getReportLinks(db, guard, { ...filters, userId: '', positionId: '' }, shareLinkId);
  const { count, error } = await applicationReportQuery(db, shareLinkId, filters, { head: true, history: true });
  if (error) throw error;
  if (typeof count !== 'number') throw new Error('Missing exact application count');
  const offset = all ? 0 : (filters.page - 1) * filters.pageSize;
  const rows = offset >= count ? [] : await readReportRows(() => applicationReportQuery(db, shareLinkId, filters, { history: true })
    .order('created_at', { ascending: false }).order('id'), offset, all ? count : Math.min(filters.pageSize, count - offset), count);
  return { link: links[0], rows, total: count, page: filters.page, pageSize: filters.pageSize };
}
