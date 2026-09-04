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

  // ==========================================
  // โหลด Branches + Languages
  // ==========================================
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
  };

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
    <div className="w-full h-full">
      <div className="overflow-y-auto p-6 w-full">
        <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Benefit From
            </h1>

            <p className="mt-2 text-slate-500">
              หน้านี้เป็นหน้าจัดการ สวัดดิการส่วนกลางของแต่ละสังกัด
            </p>
          </div>
          <div>
          </div>
        </div>
      </div>

      <div className="w-full">
        <div
          style={{
            padding: 24,
            maxWidth: 1400,
            margin: "0 auto",
          }}
        >
          <Card
            variant="borderless"
            style={{
              borderRadius: 12,
            }}
          >
            {/* ======================================
                Header
            ====================================== */}
            <div>
              <Title
                level={3}
                style={{
                  margin: 0,
                }}
              >
                สวัสดิการกลางของสังกัด
              </Title>

              <Text type="secondary">
                กำหนดรายการสวัสดิการกลาง
                สำหรับแต่ละสังกัด
              </Text>
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
              <Row gutter={[24, 16]}>
                <Col
                  xs={24}
                  sm={24}
                  md={12}
                  lg={10}
                >
                  <Form.Item
                    label="สังกัด"
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
              </Row>

              {/* ======================================
                  Benefits Header
              ====================================== */}
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  marginTop: 8,
                  marginBottom: 16,
                }}
              >
                <div>
                  <Title
                    level={5}
                    style={{
                      margin: 0,
                    }}
                  >
                    รายการสวัสดิการ
                  </Title>

                  <Text type="secondary">
                    กรอกชื่อสวัสดิการ
                    ตามภาษาที่กำหนด
                  </Text>
                </div>

                <Button
                  type="dashed"
                  icon={ <AntIcon name="PlusOutlined" /> }
                  onClick={
                    handleAddBenefit
                  }
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
                    style={{
                      marginBottom: 16,
                      background:
                        "#fafafa",
                      borderRadius: 10,
                    }}
                  >
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
                            style={{
                              width:
                                "100%",
                            }}
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
              <Divider />

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  gap: 8,
                }}
              >
                <Button
                  onClick={
                    handleReset
                  }
                >
                  ยกเลิก
                </Button>

                <Button
                  type="primary"
                  htmlType="submit"
                  icon={ <AntIcon name="SaveOutlined"/> }
                  loading={loading}
                >
                  บันทึกข้อมูล
                </Button>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
}