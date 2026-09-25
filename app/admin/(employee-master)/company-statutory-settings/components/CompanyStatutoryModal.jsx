"use client";

import { Alert, Col, DatePicker, Form, Input, Modal, Row, Select } from "antd";

const { TextArea } = Input;

function getCompany(companies, companyId) {
  return (
    companies.find(
      (item) => String(item?.id || "") === String(companyId || "")
    ) || null
  );
}

export default function CompanyStatutoryModal({
  open = false,
  form,
  editing = null,
  viewMode = false,
  saving = false,
  companies = [],
  companyLoading = false,
  onCancel,
  onSubmit,
}) {
  const companyId = Form.useWatch("company_id", form);

  const selectedCompany =
    getCompany(companies, companyId) || editing?.companies || null;

  const companyOptions = companies.map((item) => ({
    value: item.id,
    label: `${item.company_code || ""} - ${
      item.company_name_th || item.company_name_en || "-"
    }`,
  }));

  const disabled = viewMode || saving;

  return (
    <Modal
      open={open}
      width={920}
      title={
        viewMode
          ? "รายละเอียดทะเบียนภาษีและประกันสังคมบริษัท"
          : editing
            ? "แก้ไขทะเบียนภาษีและประกันสังคมบริษัท"
            : "เพิ่มทะเบียนภาษีและประกันสังคมบริษัท"
      }
      destroyOnHidden
      mask={{ closable: !saving }}
      onCancel={onCancel}
      onOk={viewMode ? onCancel : () => form.submit()}
      okText={viewMode ? "ปิด" : "บันทึก"}
      cancelButtonProps={{
        style: viewMode ? { display: "none" } : undefined,
      }}
      confirmLoading={saving}
    >
      <Form
        form={form}
        layout="vertical"
        disabled={disabled}
        onFinish={onSubmit}
      >
        <Row gutter={[16, 0]}>
          <Col xs={24}>
            <Form.Item
              label="บริษัท"
              name="company_id"
              rules={[{ required: true, message: "กรุณาเลือกบริษัท" }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                loading={companyLoading}
                options={companyOptions}
                placeholder="เลือก Company Master"
                disabled={disabled || Boolean(editing)}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Alert
              className="mb-4"
              showIcon
              type={selectedCompany?.tax_id ? "info" : "warning"}
              title="ข้อมูลภาษีจาก Company Master"
              description={
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <div>
                    <strong>Tax ID:</strong> {selectedCompany?.tax_id || "-"}
                  </div>
                  <div>
                    <strong>เลขสาขาภาษี:</strong>{" "}
                    {selectedCompany?.branch_no || "-"}
                  </div>
                  <div>
                    <strong>บริษัท:</strong>{" "}
                    {selectedCompany?.company_name_th ||
                      selectedCompany?.company_name_en ||
                      "-"}
                  </div>
                </div>
              }
            />
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="เลขบัญชีนายจ้างประกันสังคม"
              name="sso_employer_account_no"
              extra="เลขทะเบียน/เลขบัญชีนายจ้างของบริษัทที่ใช้ขึ้นทะเบียนประกันสังคม"
              rules={[
                { max: 50, message: "เลขบัญชีนายจ้างยาวเกินกำหนด" },
              ]}
            >
              <Input maxLength={50} placeholder="กรอกเลขบัญชีนายจ้าง SSO" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="เลขสาขาประกันสังคม"
              name="sso_branch_no"
              rules={[{ max: 30, message: "เลขสาขา SSO ยาวเกินกำหนด" }]}
            >
              <Input maxLength={30} placeholder="กรอกเลขสาขา SSO" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="เลขทะเบียนกองทุนเงินทดแทน"
              name="wcf_registration_no"
              rules={[
                { max: 50, message: "เลขทะเบียน WCF ยาวเกินกำหนด" },
              ]}
            >
              <Input
                maxLength={50}
                placeholder="กรอกเลขทะเบียนกองทุนเงินทดแทน"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="สถานะ"
              name="status"
              rules={[{ required: true, message: "กรุณาเลือกสถานะ" }]}
            >
              <Select
                options={[
                  { value: "active", label: "ใช้งาน" },
                  { value: "inactive", label: "ไม่ใช้งาน" },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="มีผลตั้งแต่"
              name="effective_from"
              rules={[
                { required: true, message: "กรุณาเลือกวันที่เริ่มมีผล" },
              ]}
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="มีผลถึง"
              name="effective_to"
              dependencies={["effective_from"]}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const from = getFieldValue("effective_from");
                    if (!value || !from || !value.isBefore(from, "day")) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มมีผล")
                    );
                  },
                }),
              ]}
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item label="หมายเหตุ" name="remark">
              <TextArea
                rows={3}
                maxLength={1000}
                showCount
                placeholder="รายละเอียดเพิ่มเติม"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
