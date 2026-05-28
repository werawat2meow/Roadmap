"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Image,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

export default function BenefitAttachmentsPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const canView =
    hasPermission(user, "benefit.attachment.view") ||
    hasPermission(user, "benefit.attachment.manage");

  const canDelete =
    hasPermission(user, "benefit.attachment.delete") ||
    hasPermission(user, "benefit.attachment.manage");

  const loadData = async ({
    nextPage = page,
    nextPageSize = pageSize,
    nextSearch = search,
  } = {}) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      params.set("page", String(nextPage));
      params.set("pageSize", String(nextPageSize));

      if (nextSearch) {
        params.set("search", nextSearch);
      }

      const res = await fetch(
        `/api/benefits/attachments?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "โหลดไฟล์แนบไม่สำเร็จ");
      }

      setRows(json.data || []);
      setTotal(json.total || 0);
      setPage(json.page || nextPage);
      setPageSize(json.pageSize || nextPageSize);
    } catch (error) {
      console.error("LOAD_ATTACHMENTS_ERROR:", error);
      message.error(error.message || "โหลดไฟล์แนบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      loadData({
        nextPage: 1,
        nextPageSize: 10,
        nextSearch: "",
      });
    }
  }, [canView]);

  const handleDelete = (record) => {
    Modal.confirm({
      title: "ยืนยันการลบไฟล์แนบ",
      content: `ต้องการลบ ${record.file_name} ใช่หรือไม่?`,
      okText: "ลบ",
      cancelText: "ยกเลิก",
      okButtonProps: {
        danger: true,
      },
      async onOk() {
        try {
          const res = await fetch(
            `/api/benefits/attachments/${record.id}`,
            {
              method: "DELETE",
            }
          );

          const json = await res.json();

          if (!res.ok) {
            throw new Error(json?.error || "ลบไฟล์ไม่สำเร็จ");
          }

          message.success("ลบไฟล์สำเร็จ");

          loadData();
        } catch (error) {
          console.error("DELETE_ATTACHMENT_ERROR:", error);
          message.error(error.message || "ลบไฟล์ไม่สำเร็จ");
        }
      },
    });
  };

  const columns = [
    {
      title: "File",
      width: 320,
      render: (_, record) => {
        const isImage =
          record?.file_type?.includes("image");

        return (
          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {isImage ? (
                <FileImageOutlined className="text-blue-500" />
              ) : (
                <FilePdfOutlined className="text-red-500" />
              )}
            </div>

            <div>
              <div className="font-semibold">
                {record.file_name}
              </div>

              <div className="text-xs text-slate-400">
                {record.file_type || "-"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Request No",
      width: 180,
      render: (_, record) =>
        record?.benefit_requests?.request_no || "-",
    },
    {
      title: "Employee",
      width: 240,
      render: (_, record) => {
        const emp =
          record?.benefit_requests?.employees;

        return (
          <div>
            <div className="font-semibold">
              {`${emp?.first_name_th || ""} ${
                emp?.last_name_th || ""
              }`.trim() || "-"}
            </div>

            <div className="text-xs text-slate-400">
              {emp?.employee_code || "-"}
            </div>
          </div>
        );
      },
    },
    {
      title: "Size",
      dataIndex: "file_size",
      width: 140,
      render: (value) =>
        value
          ? `${(Number(value) / 1024 / 1024).toFixed(2)} MB`
          : "-",
    },
    {
      title: "Uploaded",
      dataIndex: "uploaded_at",
      width: 180,
      render: (value) =>
        value
          ? new Date(value).toLocaleString("th-TH")
          : "-",
    },
    {
      title: "Actions",
      width: 260,
      fixed: "right",
      render: (_, record) => {
        const isImage =
          record?.file_type?.includes("image");

        return (
          <Space wrap>
            {isImage && (
              <Button
                icon={<EyeOutlined />}
                onClick={() => {
                  setPreviewFile(record);
                  setPreviewOpen(true);
                }}
              >
                Preview
              </Button>
            )}

            <Button
              icon={<DownloadOutlined />}
              onClick={() => {
                window.open(
                  `/api/benefits/attachments/${record.id}`,
                  "_blank"
                );
              }}
            >
              Download
            </Button>

            {canDelete && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
              >
                Delete
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  if (!canView) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="rounded-[24px] text-center shadow-sm">
          <div className="text-xl font-bold text-red-500">
            ไม่มีสิทธิ์เข้าถึง
          </div>

          <p className="mt-2 text-slate-500">
            คุณไม่มีสิทธิ์ดูไฟล์แนบ
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <Card
        className="rounded-[24px] shadow-sm"
        title={
          <div className="text-lg font-bold">
            Benefit Attachments
          </div>
        }
        extra={
          <Space wrap>
            <Input.Search
              allowClear
              placeholder="ค้นหาไฟล์ / Request No"
              style={{ width: 280 }}
              onSearch={(value) => {
                setSearch(value);
                setPage(1);

                loadData({
                  nextPage: 1,
                  nextSearch: value,
                });
              }}
            />

            <Button
              icon={<ReloadOutlined />}
              onClick={() =>
                loadData({
                  nextPage: page,
                  nextPageSize: pageSize,
                  nextSearch: search,
                })
              }
            >
              Refresh
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          columns={columns}
          scroll={{ x: 1500 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (value) =>
              `ทั้งหมด ${value.toLocaleString()} รายการ`,
            onChange: (
              nextPage,
              nextPageSize
            ) => {
              setPage(nextPage);
              setPageSize(nextPageSize);

              loadData({
                nextPage,
                nextPageSize,
                nextSearch: search,
              });
            },
          }}
        />
      </Card>

      <Modal
        open={previewOpen}
        footer={null}
        onCancel={() => {
          setPreviewOpen(false);
          setPreviewFile(null);
        }}
        width={900}
      >
        {previewFile && (
          <Image
            alt={previewFile.file_name}
            src={`/api/benefits/attachments/${previewFile.id}`}
            className="rounded-xl"
          />
        )}
      </Modal>
    </div>
  );
}