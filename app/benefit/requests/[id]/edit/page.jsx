"use client";

import { useEffect, useState } from "react";
import {Alert,Button,Card,Form,Input,InputNumber,Select,Space,Spin,Upload,message,} from "antd";
import {ArrowLeftOutlined,InboxOutlined,ReloadOutlined,SaveOutlined,} from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

const MAX_FILE_SIZE_MB = Number(process.env.NEXT_PUBLIC_BENEFIT_MAX_FILE_SIZE_MB || 10);
const ACCEPT_FILE_TYPES = (process.env.NEXT_PUBLIC_BENEFIT_ACCEPT_FILE_TYPES ||"application/pdf,image/jpeg,image/png").split(",");

export default function EditBenefitRequestPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  const requestId = params?.id;

  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [benefits, setBenefits] = useState([]);
  const [data, setData] = useState(null);
  const [fileList, setFileList] = useState([]);

  const canEdit = hasPermission(user, "benefit.request.edit");

  const loadBenefits = async () => {
    try {
      const res = await fetch("/api/benefits/master", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "โหลดสวัสดิการไม่สำเร็จ");
      }

      setBenefits(json.data || []);
    } catch (error) {
      console.error("LOAD_BENEFITS_ERROR:", error);
      message.error(error.message || "โหลดสวัสดิการไม่สำเร็จ");
    }
  };

  const loadDetail = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/benefits/requests/${requestId}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "โหลดรายละเอียดไม่สำเร็จ");
      }

      const detail = json.data;

      setData(detail);

      form.setFieldsValue({
        benefit_id: detail?.benefit_id || undefined,
        requested_amount: detail?.requested_amount || undefined,
        remark: detail?.remark || "",
      });

      setFileList(
        (detail?.attachments || []).map((file) => ({
          uid: file.id,
          name: file.file_name,
          status: "done",
          url: `/api/benefits/attachments/${file.id}`,
        }))
      );
    } catch (error) {
      console.error("LOAD_REQUEST_DETAIL_ERROR:", error);
      message.error(error.message || "โหลดรายละเอียดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestId && canEdit) {
      loadBenefits();
      loadDetail();
    }
  }, [requestId, canEdit]);

  const validateFile = (file) => {
    const isAllowedType = ACCEPT_FILE_TYPES.includes(file.type);

    const isAllowedSize = file.size / 1024 / 1024 <= MAX_FILE_SIZE_MB;

    if (!isAllowedType) {
      message.error("รองรับเฉพาะ PDF, JPG, PNG");
      return Upload.LIST_IGNORE;
    }

    if (!isAllowedSize) {
      message.error(
        `ขนาดไฟล์ต้องไม่เกิน ${MAX_FILE_SIZE_MB}MB`
      );

      return Upload.LIST_IGNORE;
    }

    return false;
  };

  const handleSubmit = async (values) => {
    try {
      setSaving(true);

      const amount = Number(values.requested_amount);

      if (Number.isNaN(amount) || amount < 0) {
        throw new Error("จำนวนต้องเป็นตัวเลข");
      }

      const formData = new FormData();

      formData.append("benefit_id", values.benefit_id);
      formData.append("requested_amount", amount);
      formData.append("remark", values.remark || "");

      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append("attachments", file.originFileObj);
        }
      });

      const res = await fetch(
        `/api/benefits/requests/${requestId}/edit`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "แก้ไขไม่สำเร็จ");
      }

      message.success("แก้ไขคำขอสำเร็จ");

      router.push(`/benefit/requests/${requestId}`);
    } catch (error) {
      console.error("UPDATE_REQUEST_ERROR:", error);
      message.error(error.message || "แก้ไขไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  if (!canEdit) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="rounded-[24px] text-center shadow-sm">
          <div className="text-xl font-bold text-red-500">
            ไม่มีสิทธิ์เข้าถึง
          </div>

          <p className="mt-2 text-slate-500">
            คุณไม่มีสิทธิ์แก้ไขคำขอ
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
                onClick={() => router.back()}
              />

              <div>
                <div className="text-xl font-bold text-slate-800">
                  Edit Benefit Request
                </div>

                <div className="text-sm text-slate-500">
                  แก้ไขคำขอสวัสดิการ
                </div>
              </div>
            </div>
          }
          extra={
            <Button
              icon={<ReloadOutlined />}
              onClick={loadDetail}
            >
              Refresh
            </Button>
          }
        >
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Spin />
            </div>
          ) : (
            <>
              {data?.status !== "pending" && (
                <Alert
                  className="mb-5"
                  type="warning"
                  showIcon
                  title="คำขอนี้ไม่อยู่ในสถานะ Pending"
                  description="อาจไม่สามารถแก้ไขได้ตาม policy ระบบ"
                />
              )}

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
                        message: "กรุณาเลือกสวัสดิการ",
                      },
                    ]}
                  >
                    <Select
                      showSearch
                      placeholder="เลือกสวัสดิการ"
                      options={benefits.map((item) => ({
                        label: `${item.benefit_code} - ${item.benefit_name}`,
                        value: item.id,
                      }))}
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
                      style={{ width: "100%" }}
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </div>

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
                    accept=".pdf,.jpg,.jpeg,.png"
                    beforeUpload={validateFile}
                    fileList={fileList}
                    onChange={({ fileList: newFileList }) => {
                      setFileList(newFileList);
                    }}
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
                    <Button onClick={() => router.back()}>
                      Cancel
                    </Button>

                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={saving}
                      icon={<SaveOutlined />}
                    >
                      Save Changes
                    </Button>
                  </Space>
                </div>
              </Form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}