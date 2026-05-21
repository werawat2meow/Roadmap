"use client";

import { useEffect, useState } from "react";
import {Alert,Button,Card,Form,Input,InputNumber,Modal,Select,Space,Table,Tag,Upload,message,} from "antd";
import {InboxOutlined,SaveOutlined,ArrowLeftOutlined,ReloadOutlined,EyeOutlined,EditOutlined,DeleteOutlined,CheckCircleOutlined,CloseCircleOutlined,} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

const MAX_FILE_SIZE_MB = Number(process.env.NEXT_PUBLIC_BENEFIT_MAX_FILE_SIZE_MB || 10);
const ACCEPT_FILE_TYPES = (process.env.NEXT_PUBLIC_BENEFIT_ACCEPT_FILE_TYPES ||"application/pdf,image/jpeg,image/png").split(",");
const BENEFIT_PAGE_SIZE = 100;

const STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Pending", value: "pending" },
  { label: "In Review", value: "in_review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Paid", value: "paid" },
];

export default function CreateBenefitRequestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState([]);

  const [benefits, setBenefits] = useState([]);
  const [selectedBenefit, setSelectedBenefit] = useState(null);
  const [benefitSearch, setBenefitSearch] = useState("");
  const [benefitPage, setBenefitPage] = useState(1);
  const [benefitTotal, setBenefitTotal] = useState(0);
  const [hasMoreBenefits, setHasMoreBenefits] = useState(false);

  const [requestLoading, setRequestLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [requestSearch, setRequestSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [requestPage, setRequestPage] = useState(1);
  const [requestPageSize, setRequestPageSize] = useState(10);
  const [requestTotal, setRequestTotal] = useState(0);

  const canView = hasPermission(user, "benefit.request.view") ||hasPermission(user, "benefit.request.create");
  const canCreate = hasPermission(user, "benefit.request.create");
  const canEdit = hasPermission(user, "benefit.request.edit");
  const canDelete = hasPermission(user, "benefit.request.delete");
  const canApprove = hasPermission(user, "benefit.request.approve");
  const canReject = hasPermission(user, "benefit.request.reject");

  const hasEmployeeProfile = Boolean(user?.employee_id);

  const loadBenefits = async ({ page = 1, search = "", append = false } = {}) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(BENEFIT_PAGE_SIZE));
      if (search) params.set("search", search);

      const res = await fetch(`/api/benefits/master?${params.toString()}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "โหลดข้อมูลสวัสดิการไม่สำเร็จ");
      }

      const nextRows = json.data || [];
      const total = json.total || nextRows.length;

      setBenefits((prev) => {
        if (!append) return nextRows;

        const map = new Map();
        [...prev, ...nextRows].forEach((item) => {
          map.set(item.id, item);
        });

        return Array.from(map.values());
      });

      setBenefitPage(page);
      setBenefitTotal(total);
      setHasMoreBenefits(page * BENEFIT_PAGE_SIZE < total);
    } catch (error) {
      console.error("LOAD_BENEFITS_ERROR:", error);
      message.error(error.message || "โหลดข้อมูลสวัสดิการไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async ({
    page = 1,
    pageSize = requestPageSize,
    search = requestSearch,
    status = statusFilter,
  } = {}) => {
    try {
      setRequestLoading(true);

      const cleanSearch = search?.trim() || "";
      const cleanStatus = status?.trim()?.toLowerCase() || "";

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (cleanSearch) params.set("search", cleanSearch);
      if (cleanStatus) params.set("status", cleanStatus);

      const res = await fetch(`/api/benefits/requests?${params.toString()}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "โหลดรายการคำขอไม่สำเร็จ");
      }

      setRequests(json.data || []);
      setRequestTotal(json.total || 0);
      setRequestPage(json.page || page);
      setRequestPageSize(json.pageSize || pageSize);
    } catch (error) {
      console.error("LOAD_REQUESTS_ERROR:", error);
      message.error(error.message || "โหลดรายการคำขอไม่สำเร็จ");
    } finally {
      setRequestLoading(false);
    }
  };

  useEffect(() => {
    if (canCreate || canView) {
      loadBenefits({ page: 1, search: "", append: false });
      loadRequests({ page: 1, pageSize: 10, search: "", status: "" });
    }
  }, [canCreate, canView]);

  const handleBenefitSearch = (value) => {
    setBenefitSearch(value);
    setSelectedBenefit(null);

    loadBenefits({
      page: 1,
      search: value,
      append: false,
    });
  };

  const handleBenefitPopupScroll = (event) => {
    const target = event.target;
    const isBottom =
      target.scrollTop + target.offsetHeight >= target.scrollHeight - 20;

    if (isBottom && hasMoreBenefits && !loading) {
      loadBenefits({
        page: benefitPage + 1,
        search: benefitSearch,
        append: true,
      });
    }
  };

  const handleBenefitChange = (value) => {
    const found = benefits.find((item) => item.id === value);
    setSelectedBenefit(found || null);
  };

  const validateFile = (file) => {
    const isAllowedType = ACCEPT_FILE_TYPES.includes(file.type);
    const isAllowedSize = file.size / 1024 / 1024 <= MAX_FILE_SIZE_MB;

    if (!isAllowedType) {
      message.error("รองรับเฉพาะไฟล์ PDF, JPG, PNG เท่านั้น");
      return Upload.LIST_IGNORE;
    }

    if (!isAllowedSize) {
      message.error(`ขนาดไฟล์ต้องไม่เกิน ${MAX_FILE_SIZE_MB}MB`);
      return Upload.LIST_IGNORE;
    }

    return false;
  };

  const handleSubmit = async (values) => {
    try {
      if (!hasEmployeeProfile) {
        throw new Error(
          "ไม่พบข้อมูลพนักงานของผู้ใช้งานนี้ กรุณาผูก employee_id ให้บัญชีผู้ใช้ก่อน"
        );
      }

      setSubmitting(true);

      const amount = Number(values.requested_amount);

      if (Number.isNaN(amount) || amount < 0) {
        throw new Error("กรุณากรอกจำนวนเป็นตัวเลขเท่านั้น");
      }

      const formData = new FormData();
      formData.append("benefitId", values.benefit_id);
      formData.append("requestedAmount", amount);
      formData.append("remark", values.remark || "");

      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append("attachments", file.originFileObj);
        }
      });

      const res = await fetch("/api/benefits/requests", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "สร้างคำขอไม่สำเร็จ");
      }

      message.success("สร้างคำขอสวัสดิการสำเร็จ");

      form.resetFields();
      setFileList([]);
      setSelectedBenefit(null);

      loadRequests({
        page: 1,
        pageSize: requestPageSize,
        search: requestSearch,
        status: statusFilter,
      });
    } catch (error) {
      console.error("CREATE_BENEFIT_REQUEST_ERROR:", error);
      message.error(error.message || "สร้างคำขอไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = (record, status) => {
    const actionText = status === "approved" ? "อนุมัติ" : "ปฏิเสธ";

    Modal.confirm({
      title: `ยืนยันการ${actionText}`,
      content: `ต้องการ${actionText}คำขอ ${record.request_no || "-"} ใช่หรือไม่?`,
      okText: actionText,
      cancelText: "ยกเลิก",
      okButtonProps: {
        danger: status === "rejected",
      },
      async onOk() {
        try {
          const res = await fetch("/api/benefits/approvals", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              request_id: record.id,
              status,
            }),
          });

          const json = await res.json();

          if (!res.ok) {
            throw new Error(json?.error || "อัปเดตสถานะไม่สำเร็จ");
          }

          message.success("อัปเดตสถานะสำเร็จ");

          loadRequests({
            page: requestPage,
            pageSize: requestPageSize,
            search: requestSearch,
            status: statusFilter,
          });
        } catch (error) {
          console.error("UPDATE_STATUS_ERROR:", error);
          message.error(error.message || "อัปเดตสถานะไม่สำเร็จ");
        }
      },
    });
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "ยืนยันการลบคำขอ",
      content: `ต้องการลบคำขอ ${record.request_no || "-"} ใช่หรือไม่?`,
      okText: "ลบ",
      cancelText: "ยกเลิก",
      okButtonProps: { danger: true },
      async onOk() {
        try {
          const res = await fetch(`/api/benefits/approvals?id=${record.id}`, {
            method: "DELETE",
          });

          const json = await res.json();

          if (!res.ok) {
            throw new Error(json?.error || "ลบข้อมูลไม่สำเร็จ");
          }

          message.success("ลบคำขอสำเร็จ");

          loadRequests({
            page: requestPage,
            pageSize: requestPageSize,
            search: requestSearch,
            status: statusFilter,
          });
        } catch (error) {
          console.error("DELETE_REQUEST_ERROR:", error);
          message.error(error.message || "ลบข้อมูลไม่สำเร็จ");
        }
      },
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "draft":
        return "default";
      case "pending":
        return "gold";
      case "in_review":
        return "blue";
      case "approved":
        return "green";
      case "rejected":
        return "red";
      case "cancelled":
        return "default";
      case "paid":
        return "purple";
      default:
        return "blue";
    }
  };

  const requestColumns = [
    {
      title: "เลขที่คำขอ",
      dataIndex: "request_no",
      width: 180,
      render: (value) => value || "-",
    },
    {
      title: "พนักงาน",
      width: 220,
      render: (_, record) => {
        const emp = record?.employees;
        const fullName = `${emp?.first_name_th || ""} ${
          emp?.last_name_th || ""
        }`.trim();

        return (
          <div>
            <div className="font-semibold text-slate-700">{fullName || "-"}</div>
            <div className="text-xs text-slate-400">
              {emp?.employee_code || "-"}
            </div>
          </div>
        );
      },
    },
    {
      title: "สวัสดิการ",
      width: 240,
      render: (_, record) => record?.benefits?.benefit_name || "-",
    },
    {
      title: "จำนวน",
      dataIndex: "requested_amount",
      width: 140,
      render: (value) => (value ? Number(value).toLocaleString() : "-"),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      width: 140,
      render: (value) => <Tag color={getStatusColor(value)}>{value || "-"}</Tag>,
    },
    {
      title: "วันที่สร้าง",
      dataIndex: "created_at",
      width: 180,
      render: (value) => (value ? new Date(value).toLocaleString("th-TH") : "-"),
    },
    {
      title: "หมายเหตุ",
      dataIndex: "remark",
      width: 260,
      render: (value) => value || "-",
    },
    {
      title: "จัดการ",
      width: 420,
      fixed: "right",
      render: (_, record) => (
        <Space wrap>
          {canView && (
            <Button
              icon={<EyeOutlined />}
              onClick={() => router.push(`/benefit/requests/${record.id}`)}
            >
              View
            </Button>
          )}

          {canEdit && record.status === "pending" && (
            <Button
              icon={<EditOutlined />}
              onClick={() => router.push(`/benefit/requests/${record.id}/edit`)}
            >
              Edit
            </Button>
          )}

          {canApprove && record.status === "pending" && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => updateStatus(record, "approved")}
            >
              Approve
            </Button>
          )}

          {canReject && record.status === "pending" && (
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => updateStatus(record, "rejected")}
            >
              Reject
            </Button>
          )}

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
      ),
    },
  ];

  if (!canCreate && !canView) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="rounded-[24px] text-center shadow-sm">
          <div className="text-xl font-bold text-red-500">ไม่มีสิทธิ์เข้าถึง</div>
          <p className="mt-2 text-slate-500">
            คุณไม่มีสิทธิ์เข้าถึงคำขอสวัสดิการ
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {canCreate && (
          <Card
            className="rounded-[24px] shadow-sm"
            title={
              <div className="flex items-center gap-3">
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.back()}
                />

                <div>
                  <div className="text-xl font-bold text-slate-800">
                    Create Benefit Request
                  </div>
                  <div className="text-sm text-slate-500">
                    สร้างคำขอใช้สิทธิ์สวัสดิการ
                  </div>
                </div>
              </div>
            }
            extra={
              <Button
                icon={<ReloadOutlined />}
                onClick={() =>
                  loadBenefits({
                    page: 1,
                    search: benefitSearch,
                    append: false,
                  })
                }
              >
                Refresh Benefits
              </Button>
            }
          >
            {!hasEmployeeProfile && (
              <Alert
                className="mb-5"
                type="warning"
                showIcon
                title="บัญชีนี้ยังไม่ได้ผูกข้อมูลพนักงาน"
                description="หน้านี้ต้องใช้ employee_id เพื่อสร้างคำขอสวัสดิการ กรุณาผูกบัญชีผู้ใช้กับข้อมูลพนักงานก่อน"
              />
            )}

            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Form.Item
                  label={`Benefit ${
                    benefitTotal
                      ? `(ทั้งหมด ${benefitTotal.toLocaleString()} รายการ)`
                      : ""
                  }`}
                  name="benefit_id"
                  rules={[
                    {
                      required: true,
                      message: "กรุณาเลือกสวัสดิการ",
                    },
                  ]}
                >
                  <Select
                    loading={loading}
                    placeholder="ค้นหา / เลือกสวัสดิการ"
                    showSearch
                    filterOption={false}
                    onSearch={handleBenefitSearch}
                    onPopupScroll={handleBenefitPopupScroll}
                    onChange={handleBenefitChange}
                    notFoundContent={loading ? "กำลังโหลด..." : "ไม่พบข้อมูล"}
                    options={benefits.map((item) => ({
                      label: `${item.benefit_code} - ${item.benefit_name}`,
                      value: item.id,
                    }))}
                    popupRender={(menu) => (
                      <>
                        {menu}
                        <div className="border-t border-slate-100 p-2 text-center text-xs text-slate-400">
                          แสดง {benefits.length.toLocaleString()} /{" "}
                          {benefitTotal.toLocaleString()} รายการ
                          {hasMoreBenefits ? " — เลื่อนลงเพื่อโหลดเพิ่ม" : ""}
                        </div>
                      </>
                    )}
                  />
                </Form.Item>

                <Form.Item
                  label="Requested Amount"
                  name="requested_amount"
                  rules={[
                    {
                      validator: (_, value) => {
                        if (
                          value === undefined ||
                          value === null ||
                          value === ""
                        ) {
                          return Promise.reject(new Error("กรุณากรอกจำนวน"));
                        }

                        const numberValue = Number(value);

                        if (Number.isNaN(numberValue)) {
                          return Promise.reject(
                            new Error("กรุณากรอกเป็นตัวเลขเท่านั้น")
                          );
                        }

                        if (numberValue < 0) {
                          return Promise.reject(
                            new Error("จำนวนต้องมากกว่าหรือเท่ากับ 0")
                          );
                        }

                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    precision={2}
                    inputMode="decimal"
                    stringMode={false}
                    parser={(value) => value?.replace(/[^\d.]/g, "") || ""}
                    placeholder="จำนวนเงิน / จำนวนวัน"
                  />
                </Form.Item>
              </div>

              {selectedBenefit && (
                <Alert
                  className="mb-5"
                  type="info"
                  showIcon
                  title={selectedBenefit.benefit_name}
                  description={
                    <div className="space-y-1">
                      <div>Code: {selectedBenefit.benefit_code}</div>
                      <div>Type: {selectedBenefit.benefit_type}</div>
                      <div>Description: {selectedBenefit.description || "-"}</div>
                    </div>
                  }
                />
              )}

              <Form.Item label="Remark" name="remark">
                <Input.TextArea rows={5} placeholder="รายละเอียดเพิ่มเติม" />
              </Form.Item>

              <Form.Item label="Attachments">
                <Upload.Dragger
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  fileList={fileList}
                  beforeUpload={validateFile}
                  onChange={({ fileList: newFileList }) => {
                    setFileList(newFileList);
                  }}
                  onRemove={(file) => {
                    setFileList((prev) =>
                      prev.filter((item) => item.uid !== file.uid)
                    );
                  }}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>

                  <p className="ant-upload-text">คลิกหรือ Drag file</p>

                  <p className="ant-upload-hint">
                    รองรับ PDF, JPG, PNG และอัปโหลดได้หลายไฟล์
                  </p>
                </Upload.Dragger>
              </Form.Item>

              <div className="mt-8 flex justify-end">
                <Space>
                  <Button onClick={() => router.back()}>Cancel</Button>

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                    disabled={!hasEmployeeProfile}
                    icon={<SaveOutlined />}
                  >
                    Submit Request
                  </Button>
                </Space>
              </div>
            </Form>
          </Card>
        )}

        <Card
          className="rounded-[24px] shadow-sm"
          title="รายการคำขอสวัสดิการ"
          extra={
            <Space wrap>
              <Input.Search
                allowClear
                placeholder="ค้นหาเลขที่คำขอ / พนักงาน / สวัสดิการ / หมายเหตุ"
                value={requestSearch}
                onChange={(event) => {
                  setRequestSearch(event.target.value);
                }}
                onSearch={(value) => {
                  const nextSearch = value || "";
                  setRequestSearch(nextSearch);
                  setRequestPage(1);

                  loadRequests({
                    page: 1,
                    pageSize: requestPageSize,
                    search: nextSearch,
                    status: statusFilter,
                  });
                }}
              />

              <Select
                allowClear
                placeholder="Filter Status"
                style={{ width: 180 }}
                value={statusFilter || undefined}
                onChange={(value) => {
                  const nextStatus = value || "";
                  setStatusFilter(nextStatus);
                  setRequestPage(1);

                  loadRequests({
                    page: 1,
                    pageSize: requestPageSize,
                    search: requestSearch,
                    status: nextStatus,
                  });
                }}
                options={STATUS_OPTIONS}
              />

              <Button
                icon={<ReloadOutlined />}
                onClick={() =>
                  loadRequests({
                    page: requestPage,
                    pageSize: requestPageSize,
                    search: requestSearch,
                    status: statusFilter,
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
            loading={requestLoading}
            dataSource={requests}
            columns={requestColumns}
            scroll={{ x: 1700 }}
            pagination={{
              current: requestPage,
              pageSize: requestPageSize,
              total: requestTotal,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              showTotal: (total) => `ทั้งหมด ${total.toLocaleString()} รายการ`,
              onChange: (nextPage, nextPageSize) => {
                setRequestPage(nextPage);
                setRequestPageSize(nextPageSize);

                loadRequests({
                  page: nextPage,
                  pageSize: nextPageSize,
                  search: requestSearch,
                  status: statusFilter,
                });
              },
            }}
          />
        </Card>
      </div>
    </div>
  );
}