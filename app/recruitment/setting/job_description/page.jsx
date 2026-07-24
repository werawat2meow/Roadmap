"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Table, Tag, Button, Space, Select, Typography } from "antd";
import DeleteModal from "@/app/recruitment/components/DeleteModal";

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

  // ดึงข้อมูล position สำหรับ filter (โหลดครั้งเดียว)
  useEffect(() => {
    fetchPositions();
  }, []);

  // ดึงข้อมูล job description ใหม่ทุกครั้งที่ page, pageSize หรือ positionId เปลี่ยน
  useEffect(() => {
    fetchData(page, pageSize, positionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      title: "No.",
      width: 80,
      align: "center",
      render: (_, __, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: "Company",
      dataIndex: "branches",
      key: "branches",
      render: (branches) =>
        branches?.length ? (
          <Space wrap>
            {branches.map((branch) => (
              <Tag color="blue" key={branch.branch_id}>
                {branch.branch_name}
              </Tag>
            ))}
          </Space>
        ) : (
          "-"
        ),
    },
    {
      title: "Position",
      key: "position",
      render: (_, row) =>
        row.positions_name
          ? `${row.positions_name} (${row.position_level})`
          : "-",
    },
    {
      title: "Updated at",
      dataIndex: "updated_at",
      align: "center",
      width: 220,
      render: (value) =>
        value ? new Date(value).toLocaleString("th-TH") : "-",
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      width: 220,
      render: (_, row) => (
        <Space>
          <Link href={`/recruitment/setting/job_description/${row.id}/edit`}>
            <Button type="primary">แก้ไขข้อมูล</Button>
          </Link>

          <Button danger onClick={() => handleDelete(row)}>
            ลบ
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="h-full w-full">
      <div className="overflow-y-auto p-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center rounded-3xl bg-white p-6 shadow-sm">
          <div className="justify-self-center md:justify-self-start">
            <h1 className="text-2xl font-bold text-slate-800"> Job Description </h1>
            <p className="mt-2 text-slate-500"> หน้าจัดการ Job Description </p>
          </div>
          <div className="justify-self-center md:justify-self-end">
            <button
              type="button"
              onClick={() => router.push("/recruitment/setting/job_description/create")}
              className="rounded-lg px-4 py-2 text-white font-medium shadow-sm transition-colors cursor-pointer"
              style={{ backgroundColor: "green" }}
            >
              <span>+</span>
              <span>เพิ่มรายการ Job Description</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 w-full">
        <div
          style={{
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <Space wrap>
              <Space size="small">
                <Text style={{ fontSize: 13, color: "#475569" }}>แสดง</Text>
                <Select
                  value={pageSize}
                  onChange={(val) => {
                    setPageSize(val);
                    setPage(1); // เปลี่ยน pageSize ให้กลับไปหน้าแรกเสมอ
                  }}
                  style={{ width: 110 }}
                  options={pageSizeOptions.map((n) => ({
                    value: n,
                    label: `${n} rows`,
                  }))}
                />
              </Space>

              <Space size="small">
                <Text style={{ fontSize: 13, color: "#475569" }}>
                  Position
                </Text>

                <Select
                  allowClear
                  showSearch
                  placeholder="เลือกตำแหน่ง"
                  style={{ width: 320 }}
                  value={positionId}
                  optionFilterProp="label"
                  onChange={(value) => {
                    setPositionId(value);
                    setPage(1); // เปลี่ยน filter ให้กลับไปหน้าแรกเสมอ
                  }}
                  options={positions.map((item) => ({
                    value: item.id,
                    label: item.position_name+" - "+item.position_level,
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
        </div>
      </div>
    </div>
  );
}