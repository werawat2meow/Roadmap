// "use client";

// import { useCallback, useEffect, useMemo, useState } from "react";
// import { Button, Card, Space, Typography } from "antd";
// import { FundProjectionScreenOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";

// import usePermissions from "@/hooks/usePermissions";
// import { swalConfirm, swalError, swalSuccess } from "@/components/Swal";

// import EarningTypeSearch from "./components/EarningTypeSearch";
// import EarningTypeSummaryCards from "./components/EarningTypeSummaryCards";
// import EarningTypeTable from "./components/EarningTypeTable";
// import EarningTypeModal from "./components/EarningTypeModal";

// const { Title, Text } = Typography;
// const DEFAULT_PAGE_SIZE = 20;
// const EMPTY_FILTERS = { search: "", status: "", earning_category: "" };

// async function readJsonResponse(response) {
//   try {
//     return await response.json();
//   } catch {
//     return {};
//   }
// }

// async function fetchJson(url, options) {
//   const response = await fetch(url, options);
//   const payload = await readJsonResponse(response);
//   if (!response.ok) {
//     throw new Error(payload?.message || payload?.error || "Request failed");
//   }
//   return payload;
// }

// export default function EarningTypesPage() {
//   const { loading: permissionLoading, canView, canCreate, canEdit, canDelete } =
//     usePermissions("ems.earning_types");

//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [filters, setFilters] = useState(EMPTY_FILTERS);
//   const [pagination, setPagination] = useState({ page: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0 });
//   const [modalOpen, setModalOpen] = useState(false);
//   const [modalMode, setModalMode] = useState("create");
//   const [selectedRow, setSelectedRow] = useState(null);
//   const [saving, setSaving] = useState(false);

//   const loadData = useCallback(
//     async ({ page = pagination.page, pageSize = pagination.pageSize, nextFilters = filters } = {}) => {
//       if (!canView) return;
//       try {
//         setLoading(true);
//         const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
//         if (nextFilters.search) params.set("search", nextFilters.search);
//         if (nextFilters.status) params.set("status", nextFilters.status);
//         if (nextFilters.earning_category) params.set("earning_category", nextFilters.earning_category);

//         const payload = await fetchJson(`/api/admin/earning-types?${params.toString()}`, { cache: "no-store" });
//         setRows(Array.isArray(payload?.data) ? payload.data : []);
//         setPagination({
//           page: Number(payload?.pagination?.page || page),
//           pageSize: Number(payload?.pagination?.pageSize || pageSize),
//           total: Number(payload?.pagination?.total || 0),
//         });
//       } catch (error) {
//         console.error("load earning types error:", error);
//         swalError(error?.message || "ไม่สามารถโหลดข้อมูลประเภทเงินได้");
//       } finally {
//         setLoading(false);
//       }
//     },
//     [canView, filters, pagination.page, pagination.pageSize]
//   );

//   useEffect(() => {
//     if (!permissionLoading && canView) loadData({ page: 1 });
//   }, [permissionLoading, canView]);

//   const summary = useMemo(
//     () => ({
//       total: pagination.total,
//       active: rows.filter((item) => item.status === "active").length,
//       recurring: rows.filter((item) => item.is_recurring).length,
//       taxable: rows.filter((item) => item.is_taxable).length,
//     }),
//     [rows, pagination.total]
//   );

//   const openCreate = () => {
//     if (!canCreate) return swalError("คุณไม่มีสิทธิ์เพิ่มประเภทเงินได้");
//     setSelectedRow(null);
//     setModalMode("create");
//     setModalOpen(true);
//   };

//   const openView = (record) => {
//     setSelectedRow(record);
//     setModalMode("view");
//     setModalOpen(true);
//   };

//   const openEdit = (record) => {
//     if (!canEdit) return swalError("คุณไม่มีสิทธิ์แก้ไขประเภทเงินได้");
//     setSelectedRow(record);
//     setModalMode("edit");
//     setModalOpen(true);
//   };

//   const handleSubmit = async (values) => {
//     const isCreate = modalMode === "create";
//     try {
//       setSaving(true);
//       const payload = await fetchJson(
//         isCreate ? "/api/admin/earning-types" : `/api/admin/earning-types/${selectedRow?.id}`,
//         {
//           method: isCreate ? "POST" : "PATCH",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(values),
//         }
//       );
//       swalSuccess(payload?.message || (isCreate ? "เพิ่มประเภทเงินได้เรียบร้อยแล้ว" : "แก้ไขประเภทเงินได้เรียบร้อยแล้ว"));
//       setModalOpen(false);
//       setSelectedRow(null);
//       await loadData();
//     } catch (error) {
//       console.error("save earning type error:", error);
//       swalError(error?.message || "ไม่สามารถบันทึกประเภทเงินได้");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDelete = async (record) => {
//     if (!canDelete) return swalError("คุณไม่มีสิทธิ์ลบประเภทเงินได้");
//     const confirmed = await swalConfirm(`ยืนยันลบประเภทเงินได้ ${record.earning_type_code} - ${record.earning_type_name_th} ?`);
//     if (!confirmed) return;
//     try {
//       const payload = await fetchJson(`/api/admin/earning-types/${record.id}`, { method: "DELETE" });
//       swalSuccess(payload?.message || "ลบประเภทเงินได้เรียบร้อยแล้ว");
//       await loadData({ page: rows.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page });
//     } catch (error) {
//       swalError(error?.message || "ไม่สามารถลบประเภทเงินได้");
//     }
//   };

//   if (permissionLoading) return <Card>กำลังตรวจสอบสิทธิ์...</Card>;
//   if (!canView) return <Card><Title level={4}>ไม่มีสิทธิ์เข้าถึง</Title><Text type="secondary">คุณไม่มีสิทธิ์ดูข้อมูลประเภทเงินได้</Text></Card>;

//   return (
//     <div className="space-y-4">
//       <Card>
//         <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
//           <div>
//             <Space align="center" size={10}>
//               <FundProjectionScreenOutlined className="text-xl text-blue-600" />
//               <Title level={3} style={{ margin: 0 }}>ประเภทเงินได้</Title>
//             </Space>
//             <div className="mt-1"><Text type="secondary">จัดการหมวดรายได้สำหรับ Payroll เช่น เงินเดือน ค่าล่วงเวลา โบนัส ค่าคอมมิชชั่น และเบี้ยเลี้ยง</Text></div>
//           </div>
//           <Space wrap>
//             <Button icon={<ReloadOutlined />} loading={loading} onClick={() => loadData()}>รีเฟรช</Button>
//             {canCreate ? <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>เพิ่มประเภทเงินได้</Button> : null}
//           </Space>
//         </div>
//       </Card>

//       <EarningTypeSummaryCards summary={summary} />
//       <EarningTypeSearch
//         loading={loading}
//         value={filters}
//         onSearch={async (nextFilters) => { setFilters(nextFilters); await loadData({ page: 1, nextFilters }); }}
//         onReset={async () => { setFilters(EMPTY_FILTERS); await loadData({ page: 1, nextFilters: EMPTY_FILTERS }); }}
//       />
//       <EarningTypeTable
//         loading={loading}
//         rows={rows}
//         pagination={pagination}
//         canEdit={canEdit}
//         canDelete={canDelete}
//         onView={openView}
//         onEdit={openEdit}
//         onDelete={handleDelete}
//         onChange={({ current, pageSize }) => loadData({ page: current || 1, pageSize: pageSize || DEFAULT_PAGE_SIZE })}
//       />
//       <EarningTypeModal
//         open={modalOpen}
//         mode={modalMode}
//         record={selectedRow}
//         saving={saving}
//         onCancel={() => { if (!saving) { setModalOpen(false); setSelectedRow(null); } }}
//         onSubmit={handleSubmit}
//       />
//     </div>
//   );
// }




"use client";

import { Result, Typography } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function TaxRatesPage() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <Result
        icon={<ClockCircleOutlined className="text-blue-500" />}
        title="Tax Rates"
        subTitle={
          <div className="mt-2">
            <Text type="secondary" className="text-base">
              ฟีเจอร์นี้กำลังอยู่ระหว่างการพัฒนา
            </Text>
            <br />
            <Text type="secondary" className="text-sm">
              Coming Soon
            </Text>
          </div>
        }
      />
    </div>
  );
}