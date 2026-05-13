"use client";

import { useState , useEffect } from "react";
import {Card,Button,Select,InputNumber,Input,Upload,Tag,message,Spin,} from "antd";
import {GiftOutlined,UploadOutlined,SendOutlined,WalletOutlined,} from "@ant-design/icons";

export default function BenefitRequestsPage() {
  const [form, setForm] = useState({
    benefit_id: "",
    requested_amount: null,
    remark: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [loadingBenefits, setLoadingBenefits] = useState(true);
  const [benefits, setBenefits] = useState([]);


  const loadBenefits = async () => {
    try {
      setLoadingBenefits(true);

      const res = await fetch("/api/benefits/rules", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "โหลดสวัสดิการไม่สำเร็จ");
      }

      const uniqueBenefits = [];

      const map = new Map();

      (data.data || []).forEach((item) => {
        const benefit = item.benefits;

        if (!benefit?.id) return;

        if (!map.has(benefit.id)) {
          map.set(benefit.id, true);

          uniqueBenefits.push({
            value: benefit.id,
            label: benefit.benefit_name,
          });
        }
      });

      setBenefits(uniqueBenefits);
    } catch (error) {
      console.error(error);
      message.error(error.message);
    } finally {
      setLoadingBenefits(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!form.benefit_id) {
        return message.warning("กรุณาเลือกสวัสดิการ");
      }

      setSubmitting(true);

      const res = await fetch("/api/benefits/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          benefitId: form.benefit_id,
          requestedAmount: form.requested_amount,
          remark: form.remark,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "ส่งคำขอสวัสดิการไม่สำเร็จ"
        );
      }

      message.success(
        data?.message || "ส่งคำขอสำเร็จ"
      );

      setForm({
        benefit_id: "",
        requested_amount: null,
        remark: "",
      });
    } catch (error) {
      console.error(error);

      message.error(
        error?.message ||
          "เกิดข้อผิดพลาด"
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadBenefits();
  }, []);


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
        <Card
          variant="borderless"
          className="rounded-[28px] shadow-sm"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <Tag className="m-0 rounded-full border-0 bg-emerald-100 text-emerald-700">
                  Benefit Request
                </Tag>
                <Tag className="m-0 rounded-full border-0 bg-slate-100 text-slate-600">
                  Draft
                </Tag>
              </div>

              <h1 className="text-2xl font-bold text-slate-800">
                ขอใช้สิทธิ์สวัสดิการ
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                เลือกสวัสดิการ กรอกจำนวนเงิน แนบเอกสาร และส่งคำขออนุมัติ
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700">
              <GiftOutlined />
            </div>
          </div>
        </Card>

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
                  className="w-full"
                  placeholder="เลือกประเภทสวัสดิการ"
                  options={benefits}
                  value={form.benefit_id || undefined}
                  loading={loadingBenefits}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      benefit_id: value,
                    }))
                  }
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

                <Upload beforeUpload={() => false}>
                  <Button icon={<UploadOutlined />}>
                    เลือกไฟล์แนบ
                  </Button>
                </Upload>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <Button size="large">
                  บันทึกแบบร่าง
                </Button>

                <Button
                  loading={submitting}
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
            title="สิทธิ์คงเหลือ"
          >
            <div className="space-y-4">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <WalletOutlined />
                  </div>

                  <div>
                    <div className="text-sm text-slate-500">
                      วงเงินคงเหลือ
                    </div>
                    <div className="text-2xl font-bold text-emerald-700">
                      2,000 บาท
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm text-slate-400">
                  สถานะพนักงาน
                </div>
                <div className="mt-1 font-semibold text-slate-800">
                  ACTIVE / ผ่านทดลองงาน
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm text-slate-400">
                  ระดับพนักงาน
                </div>
                <div className="mt-1 font-semibold text-slate-800">
                  P7
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                ระบบจะตรวจสอบสิทธิ์จาก Employee Master เช่น สถานะพนักงาน,
                อายุงาน และระดับตำแหน่ง
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}