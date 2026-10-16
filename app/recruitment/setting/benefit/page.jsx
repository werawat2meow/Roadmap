"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import LoadingOrb from "@/app/components/LoadingOrb";
import usePageGuard from "@/hooks/usePageGuard";

import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
  message,
} from "antd";

import AntIcon from '@/components/AntIcon';

const { Title, Text } = Typography;


export default function RecruitQuestionPage() {
  const router = useRouter();

  const { isChecking, canView, canCreate, canEdit, canDelete } = usePageGuard({
    module: "recruitment.job.description",
    unauthorizedRedirect: "/recruitment",
  });

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form] = Form.useForm();
  
  const [branches, setBranches] = useState([]);
  const [languages, setLanguages] = useState([]);

  const [benefits, setBenefits] = useState([
    {
      benefit_name: {},
      sort_order: 1,
    },
  ]);

  async function loadData() {
    try {
      setLoading(true);

      const response = await fetch(
        "/recruitment/api/benefit"
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "ไม่สามารถโหลดข้อมูลได้"
        );
      }

      setBranches(result.branches || []);
      setLanguages(result.languages || []);
    } catch (error) {
      console.error(error);

      message.error(
        error.message ||
          "ไม่สามารถโหลดข้อมูลได้"
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // โหลด Branches + Languages
  // ==========================================
  useEffect(() => {
    const timeoutId = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleBranchChange = async (branchesId) => {
    if (!branchesId) {
      setBenefits([
        {
          benefit_name: {},
          sort_order: 1,
        },
      ]);

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/recruitment/api/benefit?branches_id=${encodeURIComponent(
          branchesId
        )}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "ไม่สามารถโหลดข้อมูลสวัสดิการได้"
        );
      }

      // ==========================================
      // มีข้อมูลเดิม
      // ==========================================
      if (
        result.benefits &&
        result.benefits.length > 0
      ) {
        setBenefits(
          result.benefits.map((item) => ({
            id: item.id,
            benefit_name:
              item.benefit_name || {},
            sort_order:
              item.sort_order || 1,
          }))
        );

        message.success(
          "โหลดข้อมูลสวัสดิการของสังกัดแล้ว"
        );
      } else {
        // ==========================================
        // ไม่มีข้อมูล
        // ==========================================
        setBenefits([
          {
            benefit_name: {},
            sort_order: 1,
          },
        ]);
      }
    } catch (error) {
      console.error(error);

      message.error(
        error.message ||
          "ไม่สามารถโหลดข้อมูลสวัสดิการได้"
      );

      setBenefits([
        {
          benefit_name: {},
          sort_order: 1,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // เพิ่มรายการสวัสดิการ
  // ==========================================
  const handleAddBenefit = () => {
    setBenefits((prev) => [
      ...prev,
      {
        benefit_name: {},
        sort_order: prev.length + 1,
      },
    ]);
  };

  // ==========================================
  // ลบรายการ
  // ==========================================
  const handleRemoveBenefit = (index) => {
    setBenefits((prev) => {
      const newBenefits = prev.filter(
        (_, itemIndex) =>
          itemIndex !== index
      );

      // จัด sort_order ใหม่
      return newBenefits.map(
        (item, itemIndex) => ({
          ...item,
          sort_order: itemIndex + 1,
        })
      );
    });
  };

  // ==========================================
  // เปลี่ยนชื่อสวัสดิการแต่ละภาษา
  // ==========================================
  const handleBenefitNameChange = (
    benefitIndex,
    languageSlug,
    value
  ) => {
    setBenefits((prev) => {
      const newBenefits = [...prev];

      newBenefits[benefitIndex] = {
        ...newBenefits[benefitIndex],
        benefit_name: {
          ...newBenefits[benefitIndex]
            .benefit_name,
          [languageSlug.toUpperCase()]:
            value,
        },
      };

      return newBenefits;
    });
  };

  // ==========================================
  // เปลี่ยน Sort Order
  // ==========================================
  const handleSortOrderChange = (
    index,
    value
  ) => {
    setBenefits((prev) => {
      const newBenefits = [...prev];

      newBenefits[index] = {
        ...newBenefits[index],
        sort_order: value ?? 1,
      };

      return newBenefits;
    });
  };

  // ==========================================
  // Validation
  // ==========================================
  const validateBenefits = () => {
    if (benefits.length === 0) {
      message.error(
        "กรุณาเพิ่มรายการสวัสดิการ"
      );

      return false;
    }

    for (let i = 0; i < benefits.length; i++) {
      const benefit = benefits[i];

      for (const language of languages) {
        const languageKey =
          language.language_slug.toUpperCase();

        const value =
          benefit.benefit_name?.[
            languageKey
          ];

        if (!value?.trim()) {
          message.error(
            `กรุณากรอกรายการสวัสดิการ ${language.language_name} รายการที่ ${
              i + 1
            }`
          );

          return false;
        }
      }

      if (
        !benefit.sort_order ||
        benefit.sort_order < 1
      ) {
        message.error(
          `กรุณาระบุลำดับการแสดงผล รายการที่ ${
            i + 1
          }`
        );

        return false;
      }
    }

    return true;
  };

  // ==========================================
  // Submit
  // ==========================================
  const handleSubmit = async (values) => {
    if (!validateBenefits()) {
      return;
    }

    try {
      setLoading(true);

      const hasExistingData = benefits.some(
        (item) => item.id
      );

      const response = await fetch(
        "/recruitment/api/benefit",
        {
          method: hasExistingData
            ? "PUT"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            branches_id:
              values.branches_id,
            benefits,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "ไม่สามารถบันทึกข้อมูลได้"
        );
      }

      message.success(
        hasExistingData
          ? "แก้ไขข้อมูลสวัสดิการเรียบร้อยแล้ว"
          : "บันทึกข้อมูลสวัสดิการเรียบร้อยแล้ว"
      );

      // โหลดข้อมูลใหม่หลังบันทึก
      const refreshResponse =
        await fetch(
          `/recruitment/api/benefit?branches_id=${encodeURIComponent(
            values.branches_id
          )}`
        );

      const refreshResult =
        await refreshResponse.json();

      if (
        refreshResponse.ok &&
        refreshResult.benefits
      ) {
        setBenefits(
          refreshResult.benefits.map(
            (item) => ({
              id: item.id,
              benefit_name:
                item.benefit_name || {},
              sort_order:
                item.sort_order || 1,
            })
          )
        );
      }
    } catch (error) {
      console.error(error);

      message.error(
        error.message ||
          "ไม่สามารถบันทึกข้อมูลได้"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Reset
  // ==========================================
  const handleReset = () => {
    form.resetFields();

    setBenefits([
      {
        benefit_name: {},
        sort_order: 1,
      },
    ]);
  };

  // ==========================================
  // Loading
  // ==========================================
  if (isChecking && loading) return <LoadingOrb />;
  if (!canView) return null;

  return (
    <div className="min-h-full w-full bg-slate-50/70">
      <div className="mx-auto w-full max-w-[1600px] space-y-5 p-4 sm:p-6">
        <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 px-5 py-6 text-white shadow-lg shadow-emerald-950/10 sm:px-7 sm:py-7">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm"><AntIcon name="GiftOutlined" style={{ fontSize: 20 }} /></div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Recruitment settings</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">สวัสดิการพนักงาน</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/80">กำหนดรายการสวัสดิการส่วนกลางแยกตามสังกัดและภาษาที่ใช้งาน</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15"><AntIcon name="GlobalOutlined" /></span>
              <div><p className="text-xs text-emerald-100/70">ภาษาที่รองรับ</p><p className="font-semibold">{languages.length} ภาษา</p></div>
            </div>
          </div>
        </section>

        <section>
          <Card
            variant="borderless"
            className="overflow-hidden border border-slate-200/80 shadow-sm shadow-slate-200/60"
            style={{
              borderRadius: 24,
            }}
          >
            {/* ======================================
                Header
            ====================================== */}
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><AntIcon name="SettingOutlined" /></span>
              <div>
                <Title level={3} style={{ margin: 0, color: "#0f172a" }}>ตั้งค่าสวัสดิการกลาง</Title>
                <Text type="secondary">เลือกสังกัด แล้วกำหนดรายการสวัสดิการตามภาษาที่เปิดใช้งาน</Text>
              </div>
            </div>

            <Divider />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              {/* ======================================
                  Branch
              ====================================== */}
              <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 sm:p-5">
              <Row gutter={[24, 16]} align="bottom">
                <Col
                  xs={24}
                  sm={24}
                  md={12}
                  lg={10}
                >
                  <Form.Item
                    label={<span className="font-semibold text-slate-700">สังกัด <span className="font-normal text-slate-400">(จำเป็น)</span></span>}
                    name="branches_id"
                    rules={[
                      {
                        required: true,
                        message: "กรุณาเลือกสังกัด",
                      },
                    ]}
                  >
                    <Select
                      size="large"
                      placeholder="เลือกสังกัด"
                      showSearch
                      optionFilterProp="label"
                      options={branches.map((branch) => ({
                        value: branch.id,
                        label: branch.branch_name,
                      }))}
                      onChange={handleBranchChange}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} lg={14}>
                  <div className="mb-6 flex items-start gap-2 text-sm leading-6 text-slate-500"><AntIcon name="InfoCircleOutlined" className="mt-1 text-emerald-600" /><span>เมื่อเลือกสังกัด ระบบจะแสดงข้อมูลเดิมอัตโนมัติ หรือเริ่มรายการใหม่หากยังไม่มีข้อมูล</span></div>
                </Col>
              </Row>
              </div>

              {/* ======================================
                  Benefits Header
              ====================================== */}
              <div className="mb-4 mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Title
                    level={5}
                    style={{
                      margin: 0,
                    }}
                  >
                    รายการสวัสดิการ <span className="ml-1 text-sm font-normal text-slate-400">({benefits.length} รายการ)</span>
                  </Title>

                  <Text type="secondary">
                    กรอกชื่อสวัสดิการ
                    ตามภาษาที่กำหนด
                  </Text>
                </div>

                <Button
                  type="primary"
                  icon={ <AntIcon name="PlusOutlined" /> }
                  onClick={
                    handleAddBenefit
                  }
                  style={{ background: "#059669", borderRadius: 10, height: 40 }}
                >
                  เพิ่มรายการ
                </Button>
              </div>

              {/* ======================================
                  Benefit Items
              ====================================== */}
              {benefits.map(
                (benefit, index) => (
                  <Card
                    key={index}
                    size="small"
                    className="group border-slate-200 transition hover:border-emerald-200 hover:shadow-sm"
                    style={{
                      marginBottom: 16,
                      background: "#f8fafc",
                      borderRadius: 16,
                    }}
                  >
                    <div className="mb-3 flex items-center justify-between border-b border-slate-200/80 pb-3 md:hidden">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-700">{index + 1}</span>
                      <span className="text-xs font-medium text-slate-400">รายการที่ {index + 1}</span>
                    </div>
                    <Row
                      gutter={[
                        16, 8,
                      ]}
                      align="middle"
                    >
                      {/* Sort Order */}
                      <Col
                        xs={24}
                        sm={6}
                        md={4}
                        lg={3}
                      >
                        <Form.Item
                          label="ลำดับ"
                          required
                          style={{
                            marginBottom: 8,
                          }}
                        >
                          <InputNumber
                            min={1}
                            value={
                              benefit.sort_order
                            }
                            size="large"
                            style={{ width: "100%" }}
                            onChange={(
                              value
                            ) =>
                              handleSortOrderChange(
                                index,
                                value
                              )
                            }
                          />
                        </Form.Item>
                      </Col>

                      {/* Languages */}
                      <Col
                        xs={24}
                        sm={18}
                        md={17}
                        lg={18}
                      >
                        <Row
                          gutter={[
                            16, 8,
                          ]}
                        >
                          {languages.map(
                            (
                              language
                            ) => {
                              const languageKey =
                                language.language_slug.toUpperCase();

                              return (
                                <Col
                                  xs={24}
                                  md={12}
                                  key={
                                    language.language_slug
                                  }
                                >
                                  <Form.Item
                                    label={`สวัสดิการ (${language.language_name})`}
                                    required
                                    style={{
                                      marginBottom: 8,
                                    }}
                                  >
                                    <Input
                                      size="large"
                                      placeholder={`กรอกชื่อสวัสดิการ ${language.language_name}`}
                                      value={
                                        benefit
                                          .benefit_name?.[
                                          languageKey
                                        ] ||
                                        ""
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        handleBenefitNameChange(
                                          index,
                                          language.language_slug,
                                          e
                                            .target
                                            .value
                                        )
                                      }
                                    />
                                  </Form.Item>
                                </Col>
                              );
                            }
                          )}
                        </Row>
                      </Col>

                      {/* Delete */}
                      <Col
                        xs={24}
                        sm={24}
                        md={3}
                        lg={3}
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "flex-end",
                          alignItems:
                            "center",
                        }}
                      >
                        <Button
                          danger
                          type="text"
                          icon={ <AntIcon name="DeleteOutlined" /> }
                          disabled={
                            benefits.length ===
                            1
                          }
                          onClick={() =>
                            handleRemoveBenefit(
                              index
                            )
                          }
                        >
                          ลบรายการ
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                )
              )}

              {/* ======================================
                  Footer
              ====================================== */}
              <Divider style={{ marginTop: 28 }} />

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  onClick={
                    handleReset
                  }
                  size="large"
                  style={{ borderRadius: 10 }}
                >
                  ยกเลิก
                </Button>

                <Button
                  type="primary"
                  htmlType="submit"
                  icon={ <AntIcon name="SaveOutlined"/> }
                  loading={loading}
                  size="large"
                  style={{ background: "#059669", borderRadius: 10, minWidth: 140 }}
                >
                  บันทึกข้อมูล
                </Button>
              </div>
            </Form>
          </Card>
        </section>
      </div>
    </div>
  );
}
