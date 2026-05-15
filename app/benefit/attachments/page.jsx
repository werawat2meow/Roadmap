"use client";

import { useEffect, useState } from "react";

import {
  Card,
  Table,
  Button,
  Upload,
  Tag,
  Space,
  Image,
} from "antd";

import {
  PaperClipOutlined,
  UploadOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

export default function BenefitAttachmentsPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const loadAttachments = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        "/api/benefits/attachments",
        {
          cache: "no-store",
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json?.error || "โหลดไฟล์แนบไม่สำเร็จ"
        );
      }

      setRows(json.data || []);
    } catch (error) {
      console.error(
        "LOAD_ATTACHMENTS_ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttachments();
  }, []);

  const getFileIcon = (fileType) => {
    if (!fileType) return <PaperClipOutlined />;

    if (fileType.includes("pdf")) {
      return (
        <FilePdfOutlined className="text-red-500" />
      );
    }

    if (fileType.includes("image")) {
      return (
        <FileImageOutlined className="text-emerald-500" />
      );
    }

    return <PaperClipOutlined />;
  };

  return (
    <div className="space-y-6">
      <Card
        className="rounded-[24px] shadow-sm"
        title={
          <div className="flex items-center gap-2">
            <PaperClipOutlined className="text-emerald-600" />
            <span className="text-lg font-bold">
              Benefit Attachments
            </span>
          </div>
        }
        extra={
          <Upload>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              className="!rounded-xl"
            >
              Upload File
            </Button>
          </Upload>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          scroll={{ x: 1200 }}
          columns={[
            {
              title: "Preview",
              width: 120,
              render: (_, record) => {
                if (
                  record?.file_type?.includes("image")
                ) {
                  return (
                    <Image
                      width={60}
                      height={60}
                      className="rounded-xl object-cover"
                      src={record.file_url}
                    />
                  );
                }

                return (
                  <div className="flex h-[60px] w-[60px] items-center justify-center rounded-xl bg-slate-100 text-2xl">
                    {getFileIcon(record.file_type)}
                  </div>
                );
              },
            },
            {
              title: "File Name",
              dataIndex: "file_name",
              width: 300,
            },
            {
              title: "Type",
              dataIndex: "file_type",
              width: 180,
              render: (value) => (
                <Tag color="blue">
                  {value || "-"}
                </Tag>
              ),
            },
            {
              title: "Size",
              dataIndex: "file_size",
              width: 160,
              render: (value) => {
                if (!value) return "-";

                return `${(
                  Number(value) /
                  1024 /
                  1024
                ).toFixed(2)} MB`;
              },
            },
            {
              title: "Remark",
              dataIndex: "remark",
              width: 240,
            },
            {
              title: "Status",
              dataIndex: "is_active",
              width: 120,
              render: (value) =>
                value ? (
                  <Tag color="green">
                    Active
                  </Tag>
                ) : (
                  <Tag color="red">
                    Inactive
                  </Tag>
                ),
            },
            {
              title: "Actions",
              width: 240,
              render: (_, record) => (
                <Space>
                  <Button
                    href={record.file_url}
                    target="_blank"
                  >
                    Open
                  </Button>

                  <Button danger icon={<DeleteOutlined />}>
                    Delete
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}