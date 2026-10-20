"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Table, Tag, Button, Space, Select, Typography } from "antd";
import DeleteModal from "@/app/recruitment/components/DeleteModal";
import AntIcon from "@/components/AntIcon";

import LoadingOrb from "@/app/components/LoadingOrb";
import usePageGuard from "@/hooks/usePageGuard";

const pageSizeOptions = [10, 20, 50, 100];
const { Text } = Typography;

export default function JobDescriptionPage({ initialData }) {
  const router = useRouter();

  const [data, setData] = useState(initialData || []);
  const [total, setTotal] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const [positions, setPositions] = useState([]);
  const [positionId, setPositionId] = useState();

  const { isChecking, canView, canCreate, canEdit, canDelete } = usePageGuard({
    module: "recruitment.job.description",
    unauthorizedRedirect: "/recruitment",
  });

  // ดึงข้อมูล position สำหรับ filter (โหลดครั้งเดียว)
  useEffect(() => {
    fetchPositions();
  }, []);

  // ดึงข้อมูล job description ใหม่ทุกครั้งที่ page, pageSize หรือ positionId เปลี่ยน
  useEffect(() => {
    fetchData(page, pageSize, positionId);
  }, [page, pageSize, positionId]);

  async function fetchData(currentPage, currentPageSize, currentPositionId) {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(currentPageSize),
      });

      if (currentPositionId) {
        params.append("position_id", currentPositionId);
      }

      const res = await fetch(
        `/recruitment/api/job_description?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await res.json();

      if (!res.ok || result?.success === false) {
        throw new Error(result?.message || "Fetch failed");
      }

      // ปรับตรงนี้ให้ตรงกับ shape จริงของ response จาก backend
      // สมมติ backend ส่งกลับเป็น { data: [...], total: number }
      setData(result?.data ?? []);
      setTotal(result?.total ?? 0);
    } catch (err) {
      console.error(err);
      alert(err.message || "ดึงข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPositions() {
    try {
      const res = await fetch( `/recruitment/api/job_description/positions`,
        {
          method: "GET",
          cache: "no-store",
        } );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Load position failed");
      }

      setPositions(result?.data ?? result ?? []);
    } catch (err) {
      console.error(err);
    }
  }

  function handleDelete(item) {
    setDeleteItem(item);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteItem?.id) return;

    setDeleting(true);

    try {
      const res = await fetch(
        `/recruitment/api/job_description/${deleteItem.id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result?.message || "Delete failed");
      }

      setDeleteOpen(false);
      setDeleteItem(null);

      // ถ้าลบตัวสุดท้ายของหน้านั้นและไม่ใช่หน้าแรก ให้ถอยกลับไปหน้าก่อนหน้า
      const isLastItemOnPage = data.length === 1 && page > 1;
      const nextPage = isLastItemOnPage ? page - 1 : page;

      if (isLastItemOnPage) {
        setPage(nextPage); // useEffect จะ trigger fetchData เอง
      } else {
        fetchData(nextPage, pageSize, positionId);
      }
    } catch (err) {
      alert(err.message || "ลบไม่สำเร็จ");
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      title: "ลำดับ",
      width: 80,
      align: "center",
      render: (_, __, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: "บริษัท / สังกัด",
      dataIndex: "branches",
      key: "branches",
      render: (branches) =>
        branches?.length ? (
          <Space wrap size={[6, 6]}>
            {branches.map((branch) => (
              <Tag color="cyan" key={branch.branch_id} style={{ borderRadius: 999, padding: "2px 10px", margin: 0 }}>
                {branch.branch_name}
              </Tag>
            ))}
          </Space>
        ) : (
          "-"
        ),
    },
    {
      title: "ตำแหน่งงาน",
      key: "position",
      render: (_, row) =>
        row.positions_name ? <span className="font-semibold text-slate-800">{row.positions_name}</span> : "-",
    },
    {
      title: "อัปเดตล่าสุด",
      dataIndex: "updated_at",
      align: "center",
      width: 220,
      render: (value) =>
        value ? new Date(value).toLocaleString("th-TH") : "-",
    },
    {
      title: "จัดการ",
      key: "action",
      align: "center",
      width: 220,
      render: (_, row) => (
        <Space>
          { canEdit && (
            <Link href={`/recruitment/setting/job_description/${row.id}/edit`}>
              <Button type="primary" icon={<AntIcon name="EditOutlined" />} style={{ background: "#059669", borderRadius: 10 }}>แก้ไข</Button>
            </Link>
          )}
          { canDelete && (
            <Button danger icon={<AntIcon name="DeleteOutlined" />} onClick={() => handleDelete(row)} style={{ borderRadius: 10 }}>ลบ</Button>
          )}
        </Space>
      ),
    },
  ];

  if (isChecking) return <LoadingOrb />;
  if (!canView) return null;

  return (
    <div className="min-h-full w-full bg-slate-50/70">
      <div className="mx-auto w-full max-w-[1600px] space-y-5 p-4 sm:p-6">
        <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 px-5 py-6 text-white shadow-lg shadow-emerald-950/10 sm:px-7 sm:py-7">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm"><AntIcon name="FileTextOutlined" style={{ fontSize: 20 }} /></div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Recruitment settings</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">รายละเอียดตำแหน่งงาน</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/80">จัดการ Job Description ของแต่ละตำแหน่ง เพื่อให้ข้อมูลการสรรหาครบถ้วนและเป็นมาตรฐาน</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 backdrop-blur-sm"><p className="text-xs text-emerald-100/70">รายการทั้งหมด</p><p className="mt-1 text-xl font-bold">{total}</p></div>
              {canCreate && (
                <button type="button" onClick={() => router.push("/recruitment/setting/job_description/create")} className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white/70">
                  <AntIcon name="PlusOutlined" /> เพิ่ม Job Description
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/60">
          <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div><h2 className="font-semibold text-slate-800">รายการ Job Description</h2><p className="mt-1 text-sm text-slate-500">ค้นหาตามตำแหน่ง และจัดการรายละเอียดของแต่ละรายการ</p></div>
            <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:mt-0"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{total} รายการ</span>
          </div>
          {/* Header */}
          <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">
            <Space wrap size={[16, 12]}>
              <Space size="small" orientation="vertical" align="start">
                <Text style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>จำนวนแถว</Text>
                <Select
                  value={pageSize}
                  onChange={(val) => {
                    setPageSize(val);
                    setPage(1); // เปลี่ยน pageSize ให้กลับไปหน้าแรกเสมอ
                  }}
                  style={{ width: 130 }}
                  size="large"
                  options={pageSizeOptions.map((n) => ({
                    value: n,
                    label: `${n} rows`,
                  }))}
                />
              </Space>

              <Space size="small" direction="vertical" align="start">
                <Text style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                  ตำแหน่งงาน
                </Text>

                <Select
                  allowClear
                  showSearch
                  placeholder="เลือกตำแหน่ง"
                  className="w-[260px] sm:w-[340px]"
                  size="large"
                  value={positionId}
                  optionFilterProp="label"
                  onChange={(value) => {
                    setPositionId(value);
                    setPage(1); // เปลี่ยน filter ให้กลับไปหน้าแรกเสมอ
                  }}
                  options={positions.map((item) => ({
                    value: item.id,
                    label: item.position_name,
                  }))}
                />
              </Space>
            </Space>
          </div>

          <Table
            rowKey="id"
            columns={columns}
            dataSource={data}
            loading={loading}
            className="[&_.ant-table-thead>tr>th]:bg-slate-50/80 [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:text-slate-600 [&_.ant-table-tbody>tr>td]:py-4 [&_.ant-table-tbody>tr:hover>td]:bg-emerald-50/40"
            pagination={{
              current: page,
              pageSize: pageSize,
              total: total,
              showSizeChanger: false, // ควบคุม pageSize ด้วย Select ด้านบนแทน
              showTotal: (t) => `ทั้งหมด ${t} รายการ`,
              onChange: (newPage) => setPage(newPage),
            }}
            scroll={{ x: 900 }}
            locale={{
              emptyText: "ไม่พบข้อมูล",
            }}
          />

          <DeleteModal
            open={deleteOpen}
            item={deleteItem}
            onClose={() => setDeleteOpen(false)}
            onConfirm={confirmDelete}
            loading={deleting}
          />
        </section>
      </div>
    </div>
  );
}
