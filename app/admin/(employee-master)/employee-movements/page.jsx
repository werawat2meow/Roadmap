'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Modal,
  Space,
  Typography,
  message,
} from 'antd';
import {
  ClockCircleOutlined,
  ReloadOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '@/contexts/AuthContext';
import EmployeeMovementKpis from './components/EmployeeMovementKpis';
import EmployeeMovementFilters from './components/EmployeeMovementFilters';
import EmployeeMovementTable from './components/EmployeeMovementTable';
import EmployeeStatusChangeModal from './components/EmployeeStatusChangeModal';
import EmployeeMovementCheckDrawer from './components/EmployeeMovementCheckDrawer';
import EmployeeSeparationModal from './components/EmployeeSeparationModal';

const { Title, Text } = Typography;

const TYPES = [
  ['UPCOMING', 'รอเริ่มงาน'],
  ['STARTED', 'เริ่มงานวันแรก'],
  ['PROBATION', 'ทดลองงาน'],
  ['NOTICE', 'แจ้งลาออก'],
  ['EXIT_PENDING', 'รอพ้นสภาพ'],
  ['EXITED', 'พ้นสภาพการเป็นพนักงาน'],
  ['OTHER', 'สถานะอื่น'],
];

const KPI_TYPES = [
  ['UPCOMING', 'รอเริ่มงาน'],
  ['STARTED', 'เริ่มงานวันแรก'],
  ['PROBATION', 'ทดลองงาน'],
  ['NOTICE', 'แจ้งลาออก'],
  ['EXITED', 'พ้นสภาพเป็นพนักงาน'],
];

function hasPermission(user, codes) {
  const list = Array.isArray(codes) ? codes : [codes];

  return (
    user?.role_code === 'SUPER_ADMIN' ||
    user?.permissions?.some((item) => {
      const code = typeof item === 'string'
        ? item
        : item?.permission_code || item?.code;

      return list.includes(code);
    })
  );
}

async function getJson(url) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    cache: 'no-store',
  });

  const raw = await response.text();
  let payload = {};

  try {
    payload = JSON.parse(raw);
  } catch {
    payload = {};
  }

  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || `HTTP ${response.status}`);
  }

  return payload;
}

function initialRange() {
  // No implicit period filter: former employees from earlier months remain visible.
  return null;
}

function formatThaiDate(date) {
  if (!date) return '-';
  return dayjs(date).format('DD/MM/YYYY');
}

function formatHeaderDateTime(date) {
  return dayjs(date).format('DD/MM/YYYY | HH:mm:ss');
}

export default function EmployeeMovementsPage() {
  const { user, loadingUser } = useAuth();

  const canHrView = hasPermission(user, 'ems.employee_movements.view');
  const canAuditView = hasPermission(user, 'ems.employee_movement_audit.view');
  const canAuditEdit = hasPermission(user, 'ems.employee_movement_audit.edit');
  const canView = canHrView || canAuditView;
  const canManage = hasPermission(user, [
    'ems.employee_movements.edit',
    'ems.employee_movements.update',
  ]);

  const canAssetEdit = canManage;

  const [keywordText, setKeywordText] = useState('');
  const [codeText, setCodeText] = useState('');
  const [employeeId, setEmployeeId] = useState(null);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const employeeLookupRequestId = useRef(0);
  const [levelText, setLevelText] = useState('');
  const [keywordSearch, setKeywordSearch] = useState('');
  const [codeSearch, setCodeSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [event, setEvent] = useState('');
  const [kpiSelection, setKpiSelection] = useState(false);
  const [range, setRange] = useState(initialRange());
  const [orgOptions, setOrgOptions] = useState({});
  const [statuses, setStatuses] = useState([]);
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [exitView, setExitView] = useState('all');
  const [changeEmployee, setChangeEmployee] = useState(null);
  const [checkPanel, setCheckPanel] = useState(null);
  const [separationEmployee, setSeparationEmployee] = useState(null);
  const [checkStats, setCheckStats] = useState({});
  const [now, setNow] = useState(new Date());
  const rosterRequestId = useRef(0);

  const selectedStatusCode = statuses.find(
    (item) => item.id === filters.employee_status_id
  )?.status_code;

  const isExitTab = ['RESIGNED', 'RETIRED', 'TERMINATED'].includes(
    selectedStatusCode
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setKeywordSearch(keywordText.trim());
      setCodeSearch(codeText.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [keywordText, codeText]);

  const [employeeLookup, setEmployeeLookup] = useState("");

  useEffect(() => {
    if (!canView) return;
    const requestId = ++employeeLookupRequestId.current;
    const timer = setTimeout(async () => {
      setEmployeeLoading(true);
      try {
        const params = new URLSearchParams({ search: employeeLookup, pageSize: "20" });
        const result = await getJson(`/api/admin/employee-movements/employee-options?${params}`);
        if (requestId === employeeLookupRequestId.current) {
          setEmployeeOptions((result.data || []).map(row => ({
            value: row.id,
            label: `${row.employee_code || "-"} - ${[row.first_name_th, row.last_name_th].filter(Boolean).join(" ")}`,
          })));
        }
      } catch (error) {
        if (requestId === employeeLookupRequestId.current) {
          message.error(error.message);
          setEmployeeOptions([]);
        }
      } finally {
        if (requestId === employeeLookupRequestId.current) setEmployeeLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [canView, employeeLookup]);

  const query = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });

    if (employeeId) params.set('employee_id', employeeId);

    if (keywordSearch) {
      params.set('employee_name', keywordSearch);
    }

    if (codeSearch) {
      params.set('employee_code', codeSearch);
    }

    if (event) {
      params.set('event', event);
    }
    if (kpiSelection) params.set('kpi_today', '1');

    if (isExitTab) {
      params.set('exit_last_day', '1');
      params.set('exit_view', exitView);
    }

    if (!kpiSelection && range?.[0]) {
      params.set('from', range[0].format('YYYY-MM-DD'));
    }

    if (!kpiSelection && range?.[1]) {
      params.set('to', range[1].format('YYYY-MM-DD'));
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    if (levelText.trim()) {
      params.set('level_p', levelText.trim());
    }

    return params.toString();
  }, [
    page,
    pageSize,
    employeeId,
    keywordSearch,
    codeSearch,
    event,
    kpiSelection,
    isExitTab,
    exitView,
    range,
    filters,
    levelText,
  ]);

  const loadRoster = useCallback(async () => {
    if (!canView) return;

    const requestId = ++rosterRequestId.current;
    setLoading(true);

    try {
      const result = await getJson(`/api/admin/employee-movements/roster?${query}`);

      if (requestId !== rosterRequestId.current) {
        return;
      }

      const data = Array.isArray(result.data) ? result.data : [];
      setRows(data);
      setTotal(Number(result.pagination?.total || 0));
      setSelected([]);
    } catch (error) {
      if (requestId !== rosterRequestId.current) {
        return;
      }

      message.error(error.message);
      setRows([]);
      setTotal(0);
    } finally {
      if (requestId === rosterRequestId.current) {
        setLoading(false);
      }
    }
  }, [canView, query]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster, refresh]);

  useEffect(() => {
    if (!canView || !rows.length) { setCheckStats({}); return; }
    let cancelled = false;
    getJson('/api/admin/employee-movements/check-summary?ids=' + encodeURIComponent(rows.map(x=>x.id).join(',')))
      .then(result => { if (!cancelled) setCheckStats(result.data || {}); })
      .catch(() => { if (!cancelled) setCheckStats({}); });
    return () => { cancelled = true; };
  }, [canView, rows, refresh]);

  useEffect(() => {
    if (!canView) return;

    getJson('/api/admin/employee-movements/org-options')
      .then((result) => setOrgOptions(result.data || {}))
      .catch((error) => message.error(error.message));

    getJson('/api/admin/employee-movements/work-statuses')
      .then((result) => setStatuses(result.data || []))
      .catch((error) => message.error(error.message));
  }, [canView]);

  // KPI is independent of the table filters, dates, employee selection and tabs.
  const kpiQuery = useMemo(
    () => new URLSearchParams({ page: '1', pageSize: '1', kpi_today: '1' }).toString(),
    []
  );

  useEffect(() => {
    if (!canView) return;

    let cancelled = false;

    async function loadCounts() {
      try {
        const entries = await Promise.all(
          KPI_TYPES.map(async ([type]) => {
            const params = new URLSearchParams(kpiQuery);
            params.set('event', type);
            const result = await getJson(`/api/admin/employee-movements/roster?${params.toString()}`);
            return [type, Number(result.pagination?.total || 0)];
          })
        );

        if (!cancelled) {
          setCounts(Object.fromEntries(entries));
        }
      } catch (error) {
        if (!cancelled) {
          setCounts({});
        }
      }
    }

    loadCounts();

    return () => {
      cancelled = true;
    };
  }, [canView, kpiQuery, refresh]);

  async function bulk(action, employeeIds = selected) {
    if (!employeeIds.length) return;

    Modal.confirm({
      title: action === 'COMPLETE_ORIENTATION'
        ? 'ยืนยัน Orientation เสร็จแล้ว?'
        : 'ยืนยันดำเนินการรายการที่เลือก?',
      content: `จำนวน ${employeeIds.length} คน — ไม่เปลี่ยนสถานะพนักงานใน Employee Master`,
      okText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        setBusy(true);

        try {
          const response = await fetch('/api/admin/employee-movements/followups', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action,
              employee_ids: employeeIds,
            }),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.error || `HTTP ${response.status}`);
          }

          message.success(`ดำเนินการ ${result.updated} รายการแล้ว`);
          setSelected([]);
          setRefresh((prev) => prev + 1);
        } catch (error) {
          message.error(error.message);
        } finally {
          setBusy(false);
        }
      },
    });
  }

  async function manageExit(action, employeeIds) {
    if (!employeeIds.length) return;

    Modal.confirm({
      title: action === 'MARK_SENT'
        ? 'ยืนยันว่าส่งรายงานเข้ากลุ่มแล้ว?'
        : 'ปิดงานติดตามพนักงานพ้นสภาพ?',
      content: `${employeeIds.length} รายการ · ไม่เปลี่ยนสถานะการทำงานใน Employee Master`,
      okText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        setBusy(true);

        try {
          const response = await fetch('/api/admin/employee-movements/exit-reports', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action,
              employee_ids: employeeIds,
            }),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.error || `HTTP ${response.status}`);
          }

          message.success(`บันทึก ${result.updated} รายการแล้ว`);
          setSelected([]);
          setRefresh((prev) => prev + 1);
        } catch (error) {
          message.error(error.message);
        } finally {
          setBusy(false);
        }
      },
    });
  }

  async function submitStatusChange(values) {
    const response = await fetch('/api/admin/employee-movements/change-status', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employee_id: changeEmployee.id,
        expected_status_id: changeEmployee.employee_status_id,
        ...values,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    message.success('บันทึกสถานะการทำงานและประวัติแล้ว');
    setChangeEmployee(null);
    setSelected([]);
    setRefresh((prev) => prev + 1);
  }

  function imageSrc(value) {
    if (!value) return '';
    if (/^https:\/\//i.test(value)) return value;

    const base = process.env.NEXT_PUBLIC_DO_SPACES_PUBLIC_BASE_URL || '';

    return base
      ? `${base.replace(/\/$/, '')}/${String(value).replace(/^\/+/, '')}`
      : '';
  }

  async function printAllExitFiltered() {
    try {
      if (!canHrView) return;
      const params = new URLSearchParams(query);
      params.set('pageSize', '100');
      const ids = [];
      const seen = new Set();
      // Re-query all filtered pages; never use other employees outside the API Scope.
      // Prevent incomplete documents when the roster has changed during pagination.
      let expectedTotal = null;
      for (let current = 1; current <= 50; current += 1) {
        params.set('page', String(current));
        const result = await getJson(`/api/admin/employee-movements/roster?${params.toString()}`);
        const list = Array.isArray(result.data) ? result.data : [];
        const reportedTotal = Number(result.pagination?.total || 0);
        if (expectedTotal === null) expectedTotal = reportedTotal;
        if (reportedTotal !== expectedTotal) {
          throw new Error('รายการเปลี่ยนระหว่างรวมรายงาน กรุณารีเฟรชและลองใหม่');
        }
        for (const person of list) {
          if (['RESIGNED', 'RETIRED', 'TERMINATED'].includes(String(person.status_code || '').toUpperCase()) && !seen.has(person.id)) {
            ids.push(person.id);
            seen.add(person.id);
          }
        }
        if (current * 100 >= expectedTotal) break;
        if (current === 50) throw new Error('จำนวนรายการมากเกิน 5,000 คน กรุณากรองช่วงข้อมูลให้แคบลง');
      }
      if (!ids.length) {
        message.warning('ไม่พบพนักงานพ้นสภาพตามตัวกรอง');
        return;
      }
      await printReport('exit', ids);
    } catch (error) {
      message.error(error.message);
    }
  }

  async function printReport(mode, employeeIds = selected) {
    try {
      if (!employeeIds.length) {
        message.warning('กรุณาเลือกพนักงานก่อน');
        return;
      }

      const uniqueIds = [...new Set(employeeIds)];
      const reportRecords = [];
      // Existing print-data API enforces 1–100 employees per call.
      // Fetch each batch through the same scoped API, then print one document.
      for (let start = 0; start < uniqueIds.length; start += 100) {
        const batch = uniqueIds.slice(start, start + 100);
        const result = await getJson(
          `/api/admin/employee-movements/print-data?type=${mode === 'exit' ? 'exit' : 'orientation'}&ids=${encodeURIComponent(batch.join(','))}`
        );
        reportRecords.push(...(result.data || []));
      }
      if (reportRecords.length !== uniqueIds.length) {
        throw new Error('ข้อมูลรายงานไม่ครบทุกคน กรุณาตรวจสอบสิทธิ์และลองใหม่');
      }

      const grouped = reportRecords.reduce((accumulator, item) => {
        const key = item.branch_id || 'unknown';
        accumulator[key] ??= [];
        accumulator[key].push(item);
        return accumulator;
      }, {});

      const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[character]));

      const css = `
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: Arial, 'Noto Sans Thai', sans-serif; color: #232323; margin: 0; }
          .page { page-break-after: always; padding: 15px; }
          .top { display: flex; gap: 16px; align-items: center; border-bottom: 2px solid #ddd; padding-bottom: 12px; }
          .logo { width: 115px; height: 78px; object-fit: contain; }
          .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-top: 20px; }
          .person { text-align: center; break-inside: avoid; }
          .photo { width: 100%; height: 150px; object-fit: cover; background: #eee; }
          .name { font-size: 14px; font-weight: 600; margin: 7px 0; }
          .muted { color: #777; }
          .heading { font-size: 25px; font-weight: 700; }
          table { border-collapse: collapse; width: 100%; margin-top: 12px; font-size: 11px; }
          th { background: #484848; color: white; }
          th, td { border: 1px solid #aaa; padding: 9px; text-align: center; }
          .band { background: #e400db; color: #fff; text-align: center; font-size: 22px; font-weight: bold; padding: 12px; }
          .hint { padding: 18px; color: #777; }
        </style>
      `;

      const body = Object.values(grouped).map((group) => {
        const first = group[0];
        const logo = imageSrc(first.branch_image_url);
        const header = `
          <div class="top">
            ${logo ? `<img class="logo" src="${escapeHtml(logo)}" />` : ''}
            <div>
              <div class="heading">${escapeHtml(first.branch_name || 'สังกัด')}</div>
              <div>DATE : ${escapeHtml(dayjs(first.orientation_date || first.hire_date).format('DD / MM / YYYY'))}</div>
            </div>
          </div>
        `;

        if (mode === 'exit') {
          return `
            <section class="page">
              ${header}
              <h2 style="color:#bb1111;text-align:center;font-size:30px">พนักงานพ้นสภาพการเป็นพนักงาน · RESIGN</h2>
              <div class="grid">
                ${group.map((item) => `
                  <div class="person">
                    ${imageSrc(item.photo_url)
                      ? `<img class="photo" src="${escapeHtml(imageSrc(item.photo_url))}" />`
                      : '<div class="photo hint">ไม่มีรูปพนักงาน</div>'}
                    <div class="name">${escapeHtml(item.name)}</div>
                    <div>${escapeHtml(item.employee_code)}</div>
                    <div>${escapeHtml(item.department || '')}</div>
                    <div>เริ่มงาน ${escapeHtml(item.hire_date || '-')}</div>
                    <div>Last Day ${escapeHtml(item.exit_date || '-')}</div>
                    <div>${escapeHtml(item.employee_status || '')}</div>
                  </div>
                `).join('')}
              </div>
            </section>
          `;
        }

        if (mode === 'cards') {
          return `
            <section class="page">
              ${header}
              <h2>NEW STAFF EMPLOYEE</h2>
              <div class="grid">
                ${group.map((item) => `
                  <div class="person">
                    ${imageSrc(item.photo_url)
                      ? `<img class="photo" src="${escapeHtml(imageSrc(item.photo_url))}" />`
                      : '<div class="photo hint">ไม่มีรูปพนักงาน</div>'}
                    <div class="name">${escapeHtml(item.name)}</div>
                    <div>${escapeHtml(item.department || '')}</div>
                    <div class="muted">${escapeHtml(item.employee_code)}</div>
                  </div>
                `).join('')}
              </div>
            </section>
          `;
        }

        return `
          <section class="page">
            <div class="band">${escapeHtml(dayjs(first.orientation_date || first.hire_date).format('DD.MM.YYYY'))}</div>
            ${header}
            <table>
              <thead>
                <tr>
                  <th>วันที่ Orientation</th>
                  <th>ชื่อ–สกุลพนักงานใหม่</th>
                  <th>แผนก</th>
                  <th>สังกัด</th>
                  <th>สถานที่</th>
                  <th>ผล Orientation</th>
                </tr>
              </thead>
              <tbody>
                ${group.map((item) => `
                  <tr>
                    <td>${escapeHtml(item.orientation_date)}</td>
                    <td>${escapeHtml(item.name)}</td>
                    <td>${escapeHtml(item.department)}</td>
                    <td>${escapeHtml(item.branch_name)}</td>
                    <td>${escapeHtml(item.orientation_location || '-')}</td>
                    <td>${item.orientation_status === 'COMPLETED' ? 'เสร็จแล้ว' : 'รอดำเนินการ'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </section>
        `;
      }).join('');

      const popup = window.open('', '_blank');

      if (!popup) {
        message.error('โปรดอนุญาต Pop-up สำหรับการพิมพ์');
        return;
      }

      popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Employee Movement Report</title>${css}</head><body>${body}<script>window.onload=()=>setTimeout(()=>window.print(),600)<\/script></body></html>`);
      popup.document.close();
    } catch (error) {
      message.error(error.message);
    }
  }

  function reset() {
    setEmployeeId(null);
    setEmployeeLookup("");
    setKeywordText('');
    setCodeText('');
    setLevelText('');
    setKeywordSearch('');
    setCodeSearch('');
    setFilters({});
    setEvent('');
    setKpiSelection(false);
    setRange(initialRange());
    setExitView('all');
    setPage(1);
    setSelected([]);
  }

  async function exportCSV() {
    try {
      const params = new URLSearchParams(query);
      params.set('page', '1');
      params.set('pageSize', '100');

      const allRows = [];
      const pages = Math.max(1, Math.ceil(total / 100));

      for (let index = 1; index <= pages; index += 1) {
        params.set('page', String(index));
        const result = await getJson(`/api/admin/employee-movements/roster?${params.toString()}`);
        allRows.push(...(result.data || []));
      }

      const safe = (value) => {
        let text = String(value ?? '');
        if (/^[\s]*[=+@\-\t\r]/.test(text)) {
          text = `'${text}`;
        }
        return `"${text.replaceAll('"', '""')}"`;
      };

      const csv = [
        ['รหัสพนักงาน', 'ชื่อ-นามสกุล', 'บริษัท', 'สังกัด', 'แผนก', 'สถานะการทำงาน', 'ประเภทติดตาม', 'วันเริ่มงาน', 'วันพ้นสภาพ'],
        ...allRows.map((row) => [
          row.employee_code,
          `${row.first_name_th || ''} ${row.last_name_th || ''}`.trim(),
          row.organization?.company_id || '-',
          row.organization?.branch_id || '-',
          row.organization?.department_id || '-',
          row.status_name || '-',
          TYPES.find((item) => item[0] === row.event)?.[1] || row.event || '-',
          row.hire_date || '-',
          row.resignation_date || '-',
        ]),
      ]
        .map((line) => line.map(safe).join(','))
        .join('\r\n');

      const blob = new Blob([`\uFEFF${csv}`], {
        type: 'text/csv;charset=utf-8',
      });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'employee-movement-dashboard.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      message.error(error.message);
    }
  }

  function showChecklist() {
    if (selected.length !== 1) {
      message.info('กรุณาเลือกพนักงาน 1 คนเพื่อเปิด CheckList');
      return;
    }

    const employee = rows.find(
      row => row.id === selected[0]
    );

    if (employee) {
      setCheckPanel({
        employee,
        area: 'AUDIT'
      });
    }
  }

  if (loadingUser) {
    return <Card loading />;
  }

  if (!canView) {
    return (
      <Alert
        type="error"
        showIcon
        message="คุณไม่มีสิทธิ์เข้าถึงหน้าติดตามพนักงานเข้า–ออก"
        description="ต้องได้รับ ems.employee_movements.view หรือ ems.employee_movement_audit.view"
      />
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          <ClockCircleOutlined />
          <span>{formatHeaderDateTime(now)}</span>
        </div>

        <Title level={2} style={{ margin: 0 }}>
          <TeamOutlined /> Dashboard - การติดตามพนักงาน
        </Title>

        <div style={{ marginTop: 8 }}>
          <Text type="secondary">
            {range?.[0] || range?.[1] ? `${formatThaiDate(range?.[0])} - ${formatThaiDate(range?.[1])}` : 'ทุกช่วงวันที่ · เลือกวันที่เพื่อกรองรายการ'}
          </Text>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => setRefresh((prev) => prev + 1)}>
            รีเฟรช
          </Button>
        </Space>
      </div>

      <EmployeeMovementKpis
        kpis={KPI_TYPES}
        counts={counts}
        event={event}
        onSelect={(key) => {
          const sameKpi = kpiSelection && event === key;
          setEvent(sameKpi ? '' : key);
          setKpiSelection(!sameKpi);
          setFilters((current) => ({ ...current, employee_status_id: undefined }));
          setPage(1);
          setSelected([]);
        }}
      />

      <EmployeeMovementFilters
        keywordText={keywordText}
        setKeywordText={setKeywordText}
        codeText={codeText}
        setCodeText={setCodeText}
        levelText={levelText}
        setLevelText={setLevelText}
        range={range}
        setRange={setRange}
        filters={filters}
        setFilters={setFilters}
        event={event}
        setEvent={(value) => { setKpiSelection(false); setEvent(value); setPage(1); }}
        statuses={statuses}
        types={TYPES}
        orgOptions={orgOptions}
        onReset={reset}
        onExport={canHrView ? exportCSV : undefined}
        onChecklist={showChecklist}
        employeeId={employeeId}
        onEmployeeChange={value => { setEmployeeId(value || null); setPage(1); setSelected([]); }}
        employeeOptions={employeeOptions}
        employeeLoading={employeeLoading}
        onEmployeeSearch={setEmployeeLookup}
      />

      <EmployeeStatusChangeModal
        employee={changeEmployee}
        statuses={statuses}
        onCancel={() => setChangeEmployee(null)}
        onSave={submitStatusChange}
      />

      <EmployeeMovementTable
        rows={rows.map(r => ({ ...r, check_stats: checkStats[r.id] }))}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        setPage={setPage}
        setPageSize={setPageSize}
        selected={selected}
        setSelected={setSelected}
        statuses={statuses}
        filters={filters}
        busy={busy}
        canManage={canManage}
        canHrView={canHrView}
        canAuditView={canAuditView}
        bulk={bulk}
        printReport={printReport}
        onOpenSeparation={(employee) => setSeparationEmployee(employee)}
        printAllExitFiltered={printAllExitFiltered}
        manageExit={manageExit}
        exitView={exitView}
        setExitView={setExitView}
        isExitTab={isExitTab}
        onChangeStatus={setChangeEmployee}
        onManageChecklist={(employee, area) => setCheckPanel({ employee, area })}
      />
      <EmployeeSeparationModal
        employee={separationEmployee}
        open={Boolean(separationEmployee)}
        onClose={() => setSeparationEmployee(null)}
        getJson={getJson}
        imageSrc={imageSrc}
      />
      <EmployeeMovementCheckDrawer
        employee={checkPanel?.employee}
        area={checkPanel?.area}
        onClose={() => setCheckPanel(null)}
        canManage={checkPanel?.area === "AUDIT" ? canAuditEdit : canAssetEdit}
        onChanged={() => setRefresh(x => x + 1)}
      />

      <div style={{ marginTop: 12 }}>
        <Text type="secondary">
          HR รับผิดชอบสถานะพนักงาน/Orientation/รายงานและ Company Assets · Audit รับผิดชอบ Audit Management ภายใน Scope ของตน · ยังไม่เชื่อม LINE หรือทะเบียนทรัพย์สิน
        </Text>
      </div>
    </div>
  );
}
