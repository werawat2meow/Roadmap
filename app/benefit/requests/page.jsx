"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Button,
  Select,
  InputNumber,
  Input,
  Upload,
  Tag,
  message,
  Spin,
  Alert,
} from "antd";
import {
  GiftOutlined,
  SendOutlined,
  WalletOutlined,
  InboxOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

const MAX_FILE_SIZE_MB = Number(
  process.env.NEXT_PUBLIC_BENEFIT_MAX_FILE_SIZE_MB || 10
);

const ACCEPT_FILE_TYPES = (
  process.env.NEXT_PUBLIC_BENEFIT_ACCEPT_FILE_TYPES ||
  "application/pdf,image/jpeg,image/png"
).split(",");

export default function BenefitRequestsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState({
    benefit_id: "",
    requested_amount: null,
    remark: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [loadingBenefits, setLoadingBenefits] = useState(true);
  const [benefits, setBenefits] = useState([]);
  const [selectedBenefit, setSelectedBenefit] = useState(null);
  const [fileList, setFileList] = useState([]);

  const canCreate = hasPermission(user, "benefit.request.create");
  const hasEmployeeProfile = Boolean(user?.employee_id);

  const loadBenefits = async () => {
    try {
      setLoadingBenefits(true);

      const res = await fetch("/api/benefits/master?page=1&pageSize=100", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "โหลดสวัสดิการไม่สำเร็จ");
      }

      const activeBenefits = (data.data || [])
        .filter((item) => item.is_active !== false)
        .map((item) => ({
          value: item.id,
          label: `${item.benefit_code} - ${item.benefit_name}`,
          raw: item,
        }));

      setBenefits(activeBenefits);
    } catch (error) {
      console.error("LOAD_BENEFITS_ERROR:", error);
      message.error(error.message || "โหลดสวัสดิการไม่สำเร็จ");
    } finally {
      setLoadingBenefits(false);
    }
  };

  useEffect(() => {
    if (canCreate) {
      loadBenefits();
    }
  }, [canCreate]);

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

  const handleBenefitChange = (value) => {
    const found = benefits.find((item) => item.value === value);

    setForm((prev) => ({
      ...prev,
      benefit_id: value,
    }));

    setSelectedBenefit(found?.raw || null);
  };

  const handleSubmit = async () => {
    try {
      if (!hasEmployeeProfile) {
        return message.error(
          "ไม่พบข้อมูลพนักงานของผู้ใช้งานนี้ กรุณาผูก employee_id ก่อน"
        );
      }

      if (!form.benefit_id) {
        return message.warning("กรุณาเลือกสวัสดิการ");
      }

      const amount = Number(form.requested_amount);

      if (
        form.requested_amount === null ||
        form.requested_amount === undefined ||
        Number.isNaN(amount) ||
        amount < 0
      ) {
        return message.warning("กรุณากรอกจำนวนเงินให้ถูกต้อง");
      }

      setSubmitting(true);

      const formData = new FormData();
      formData.append("benefitId", form.benefit_id);
      formData.append("requestedAmount", amount);
      formData.append("remark", form.remark || "");

      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append("attachments", file.originFileObj);
        }
      });

      const res = await fetch("/api/benefits/requests", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "ส่งคำขอสวัสดิการไม่สำเร็จ");
      }

      message.success(data?.message || "ส่งคำขอสำเร็จ");

      setForm({
        benefit_id: "",
        requested_amount: null,
        remark: "",
      });
      setSelectedBenefit(null);
      setFileList([]);

      router.push("/benefit/requests/history");
    } catch (error) {
      console.error("CREATE_BENEFIT_REQUEST_ERROR:", error);
      message.error(error?.message || "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card className="rounded-[24px] text-center shadow-sm">
          <div className="text-xl font-bold text-red-500">ไม่มีสิทธิ์เข้าถึง</div>
          <p className="mt-2 text-slate-500">คุณไม่มีสิทธิ์ขอใช้สวัสดิการ</p>
        </Card>
      </div>
    );
  }

  if (loadingBenefits) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card variant="borderless" className="rounded-[28px] shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <Tag className="m-0 rounded-full border-0 bg-emerald-100 text-emerald-700">
                  Benefit Request
                </Tag>

                <Tag className="m-0 rounded-full border-0 bg-slate-100 text-slate-600">
                  Employee Self Service
                </Tag>
              </div>

              <h1 className="text-2xl font-bold text-slate-800">
                ขอใช้สิทธิ์สวัสดิการ
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                เลือกสวัสดิการ กรอกจำนวนเงิน แนบเอกสาร และส่งคำขออนุมัติ
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                icon={<HistoryOutlined />}
                onClick={() => router.push("/benefit/requests/history")}
              >
                ประวัติคำขอ
              </Button>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700">
                <GiftOutlined />
              </div>
            </div>
          </div>
        </Card>

        {!hasEmployeeProfile && (
          <Alert
            type="warning"
            showIcon
            className="rounded-2xl"
            title="บัญชีนี้ยังไม่ได้ผูกข้อมูลพนักงาน"
            description="ต้องผูก employee_id ให้บัญชีผู้ใช้ก่อน จึงจะส่งคำขอสวัสดิการได้"
          />
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card
            variant="borderless"
            className="rounded-[28px] shadow-sm xl:col-span-2"
            title="รายละเอียดคำขอ"
          >
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  เลือกสวัสดิการ
                </label>

                <Select
                  size="large"
                  showSearch
                  optionFilterProp="label"
                  className="w-full"
                  placeholder="เลือกประเภทสวัสดิการ"
                  options={benefits}
                  value={form.benefit_id || undefined}
                  loading={loadingBenefits}
                  onChange={handleBenefitChange}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  จำนวนเงินที่ต้องการขอใช้สิทธิ์
                </label>

                <InputNumber
                  size="large"
                  className="!w-full"
                  min={0}
                  precision={2}
                  inputMode="decimal"
                  placeholder="0.00"
                  value={form.requested_amount}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      requested_amount: value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  หมายเหตุ
                </label>

                <Input.TextArea
                  rows={4}
                  placeholder="ระบุรายละเอียดเพิ่มเติม"
                  value={form.remark}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      remark: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  เอกสารแนบ
                </label>

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
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <Button
                  size="large"
                  onClick={() => {
                    setForm({
                      benefit_id: "",
                      requested_amount: null,
                      remark: "",
                    });
                    setSelectedBenefit(null);
                    setFileList([]);
                  }}
                >
                  ล้างข้อมูล
                </Button>

                <Button
                  loading={submitting}
                  disabled={!hasEmployeeProfile}
                  type="primary"
                  size="large"
                  icon={<SendOutlined />}
                  onClick={handleSubmit}
                  className="!bg-emerald-600 hover:!bg-emerald-700"
                >
                  ส่งคำขอ
                </Button>
              </div>
            </div>
          </Card>

          <Card
            variant="borderless"
            className="rounded-[28px] shadow-sm"
            title="ข้อมูลสิทธิ์"
          >
            <div className="space-y-4">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <WalletOutlined />
                  </div>

                  <div>
                    <div className="text-sm text-slate-500">สวัสดิการที่เลือก</div>
                    <div className="text-lg font-bold text-emerald-700">
                      {selectedBenefit?.benefit_name || "-"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm text-slate-400">Benefit Code</div>
                <div className="mt-1 font-semibold text-slate-800">
                  {selectedBenefit?.benefit_code || "-"}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm text-slate-400">ประเภทสวัสดิการ</div>
                <div className="mt-1 font-semibold text-slate-800">
                  {selectedBenefit?.benefit_type || "-"}
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                ระบบจะตรวจสอบสิทธิ์จาก Employee Master เช่น สถานะพนักงาน,
                อายุงาน และระดับตำแหน่งก่อนสร้างคำขอ
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}