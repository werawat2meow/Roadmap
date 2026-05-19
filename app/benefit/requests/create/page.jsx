"use client";

import { useEffect, useState } from "react";
import {Alert,Button,Card,Form,Input,InputNumber,Select,Space,Upload,message,} from "antd";
import {InboxOutlined,SaveOutlined,ArrowLeftOutlined,} from "@ant-design/icons";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

export default function CreateBenefitRequestPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [benefits, setBenefits] = useState([]);
  const [selectedBenefit, setSelectedBenefit] = useState(null);

  const canCreate = hasPermission(user, "benefit.request.create");

  const loadBenefits = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        "/api/benefits/master",
        {
          cache: "no-store",
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json?.error ||
            "โหลดข้อมูลสวัสดิการไม่สำเร็จ"
        );
      }

      setBenefits(json.data || []);
    } catch (error) {
      console.error(
        "LOAD_BENEFITS_ERROR:",
        error
      );

      message.error(
        error.message ||
          "โหลดข้อมูลสวัสดิการไม่สำเร็จ"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canCreate) {
      loadBenefits();
    }
  }, [canCreate]);

  const handleBenefitChange = (value) => {
    const found = benefits.find(
      (item) => item.id === value
    );

    setSelectedBenefit(found || null);
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);

      const res = await fetch(
        "/api/benefits/requests",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            benefitId:
              values.benefit_id,
            requestedAmount:
              values.requested_amount,
            remark:
              values.remark,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json?.error ||
            "สร้างคำขอไม่สำเร็จ"
        );
      }

      message.success(
        "สร้างคำขอสวัสดิการสำเร็จ"
      );

      router.push(
        "/benefit/approvals"
      );
    } catch (error) {
      console.error(
        "CREATE_BENEFIT_REQUEST_ERROR:",
        error
      );

      message.error(
        error.message ||
          "สร้างคำขอไม่สำเร็จ"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="rounded-[24px] text-center shadow-sm">
          <div className="text-xl font-bold text-red-500">
            ไม่มีสิทธิ์เข้าถึง
          </div>

          <p className="mt-2 text-slate-500">
            คุณไม่มีสิทธิ์สร้างคำขอสวัสดิการ
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <div className="mx-auto max-w-5xl">
        <Card
          className="rounded-[24px] shadow-sm"
          title={
            <div className="flex items-center gap-3">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() =>
                  router.back()
                }
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
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Form.Item
                label="Benefit"
                name="benefit_id"
                rules={[
                  {
                    required: true,
                    message:
                      "กรุณาเลือกสวัสดิการ",
                  },
                ]}
              >
                <Select
                  loading={loading}
                  placeholder="เลือกสวัสดิการ"
                  showSearch
                  optionFilterProp="label"
                  onChange={
                    handleBenefitChange
                  }
                  options={benefits.map(
                    (item) => ({
                      label: `${item.benefit_code} - ${item.benefit_name}`,
                      value: item.id,
                    })
                  )}
                />
              </Form.Item>

              <Form.Item
                label="Requested Amount"
                name="requested_amount"
                rules={[
                  {
                    required: true,
                    message: "กรุณากรอกจำนวน",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder="จำนวนเงิน / จำนวนวัน"
                />
              </Form.Item>
            </div>

            {selectedBenefit && (
              <Alert
                className="mb-5"
                type="info"
                showIcon
                title={
                  selectedBenefit.benefit_name
                }
                description={
                  <div className="space-y-1">
                    <div>
                      Code:{" "}
                      {
                        selectedBenefit.benefit_code
                      }
                    </div>

                    <div>
                      Type:{" "}
                      {
                        selectedBenefit.benefit_type
                      }
                    </div>

                    <div>
                      Description:{" "}
                      {
                        selectedBenefit.description
                      }
                    </div>
                  </div>
                }
              />
            )}

            <Form.Item
              label="Remark"
              name="remark"
            >
              <Input.TextArea
                rows={5}
                placeholder="รายละเอียดเพิ่มเติม"
              />
            </Form.Item>

            <Form.Item label="Attachments">
              <Upload.Dragger
                multiple
                beforeUpload={() => false}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>

                <p className="ant-upload-text">
                  คลิกหรือ Drag file
                </p>

                <p className="ant-upload-hint">
                  รองรับ PDF, JPG, PNG
                </p>
              </Upload.Dragger>
            </Form.Item>

            <div className="mt-8 flex justify-end">
              <Space>
                <Button
                  onClick={() =>
                    router.back()
                  }
                >
                  Cancel
                </Button>

                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  icon={<SaveOutlined />}
                >
                  Submit Request
                </Button>
              </Space>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}