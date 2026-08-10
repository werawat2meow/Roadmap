"use client";

import { useEffect, useState, use } from "react";
import { notFound } from "next/navigation";
import CandidateDetail from "@/app/recruitment/components/CandidateDetail";
import LoadingOrb from "@/app/components/LoadingOrb";
import usePageGuard from "@/hooks/usePageGuard";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  InputNumber,
  Radio,
  Input,
  Typography,
  Space,
  Button,
  message,
} from "antd";

const { Title, Text } = Typography;

export default function Page({ params }) {
  const router = useRouter();

  const { isChecking, canView, canEdit } = usePageGuard({
    module: "recruitment.approve.emp",
    unauthorizedRedirect: "/recruitment",
  });

  const { id } = use(params);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [master, setMaster] = useState({
    branches: [],
    departments: [],
    divisions: [],
    units: [],
    positions: [],
    position_levels: [],
    employment_types: [],
    roles: [],
  });

  const [form, setForm] = useState({
    branch_id: null,
    department_id: null,
    division_id: null,
    unit_id: null,
    position_id: null,
    position_level_id: null,
    start_date: dayjs(),
    base_salary: 0,
    position_allowance: 0,
    living_allowance: 0,
    special_allowance: 0,
    fuel_allowance: 0,
    incentive_type: null,
    incentive_amount: 0,
    oc: 0,
    phone_allowance: 0,
    employment_type_id: null,
    role_id: null,
  });

  useEffect(() => {
    if (id) fetchCandidateDetail();
  }, [id]);

  async function fetchCandidateDetail() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/recruitment/api/candidate_detail/${id}`, { method: "GET", cache: "no-store",});

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Load candidate detail failed");
      }

      setData(result ?? null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMaster(type, params = {}) {
    try {
      const query = new URLSearchParams({
        type,
        ...Object.fromEntries(
          Object.entries(params).filter(
            ([, value]) => value !== null && value !== undefined && value !== ""
          )
        ),
      });

      const res = await fetch(
        `/recruitment/api/approve_employees/employee-master?${query.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await res.json();

      if (!res.ok) { throw new Error( result.message || `Load ${type} failed` ); }

      return result.data || [];
    } catch (error) {
      console.error(error);
      message.error(error.message || "ไม่สามารถโหลดข้อมูลได้");
      return [];
    }
  }

  useEffect(() => {
    async function loadMaster() {
      const [
        branches,
        employment_types,
        roles,
      ] = await Promise.all([
        fetchMaster("branches"),
        fetchMaster("employment_types"),
        fetchMaster("roles"),
      ]);

      setMaster((prev) => ({
        ...prev,
        branches,
        employment_types,
        roles,
      }));
    }

    loadMaster();
  }, []);

  async function handleBranchChange(value) {
    setForm((prev) => ({
      ...prev,
      branch_id: value,
      department_id: null,
      division_id: null,
      unit_id: null,
      position_id: null,
    }));

    setMaster((prev) => ({
      ...prev,
      departments: [],
      divisions: [],
      units: [],
      positions: [],
    }));

    if (!value) return;

    const departments = await fetchMaster("departments", {
      branch_id: value,
    });

    setMaster((prev) => ({
      ...prev,
      departments,
    }));
  }

  async function handleDepartmentChange(value) {
    setForm((prev) => ({
      ...prev,
      department_id: value,
      division_id: null,
      unit_id: null,
      position_id: null,
    }));

    setMaster((prev) => ({
      ...prev,
      divisions: [],
      units: [],
      positions: [],
    }));

    if (!value) return;

    const divisions = await fetchMaster("divisions", {
      department_id: value,
    });

    setMaster((prev) => ({
      ...prev,
      divisions,
    }));
  }

  async function handleDivisionChange(value) {
    setForm((prev) => ({
      ...prev,
      division_id: value,
      unit_id: null,
      position_id: null,
    }));

    setMaster((prev) => ({
      ...prev,
      units: [],
      positions: [],
    }));

    if (!value) return;

    const units = await fetchMaster("units", {
      division_id: value,
    });

    setMaster((prev) => ({
      ...prev,
      units,
    }));
  }

  async function handleUnitChange(value) {
    setForm((prev) => ({
      ...prev,
      unit_id: value,
      position_id: null,
      position_level_id: null,
    }));

    setMaster((prev) => ({
      ...prev,
      positions: [],
      position_levels: [],
    }));

    if (!value) return;

    const positions = await fetchMaster("positions", {
      unit_id: value,
    });

    setMaster((prev) => ({
      ...prev,
      positions,
    }));
  }

  async function handlePositionChange(value) {
    setForm((prev) => ({
      ...prev,
      position_id: value,
      position_level_id: null,
    }));

    setMaster((prev) => ({
      ...prev,
      position_levels: [],
    }));

    if (!value) return;

    const position_levels = await fetchMaster(
      "position_levels",
      {
        position_id: value,
      }
    );

    setMaster((prev) => ({
      ...prev,
      position_levels,
    }));
  }

  const totalSalary =
    Number(form.base_salary || 0) +
    Number(form.position_allowance || 0) +
    Number(form.living_allowance || 0) +
    Number(form.special_allowance || 0) +
    Number(form.fuel_allowance || 0);

  function updateForm(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSave() {
    try {
      // validate ข้อมูลที่จำเป็น
      if (!form.branch_id) {
        message.warning("กรุณาเลือก Branch");
        return;
      }

      if (!form.department_id) {
        message.warning("กรุณาเลือก Department");
        return;
      }

      if (!form.division_id) {
        message.warning("กรุณาเลือก Division");
        return;
      }

      if (!form.unit_id) {
        message.warning("กรุณาเลือก Unit");
        return;
      }

      if (!form.position_id) {
        message.warning("กรุณาเลือก Position");
        return;
      }

      if (!form.position_level_id) {
        message.warning("กรุณาเลือก Position Level");
        return;
      }

      if (!form.start_date) {
        message.warning("กรุณาเลือกวันที่เริ่มทำงาน");
        return;
      }

      if (!form.employment_type_id) {
        message.warning("กรุณาเลือกประเภทการจ้างงาน");
        return;
      }

      const payload = {
        application_id: id,
        branch_id: form.branch_id,
        department_id: form.department_id,
        division_id: form.division_id,
        unit_id: form.unit_id,
        position_id: form.position_id,
        position_level_id: form.position_level_id,
        start_date: dayjs(form.start_date).format("YYYY-MM-DD"),
        base_salary: Number(form.base_salary || 0),
        position_allowance: Number(form.position_allowance || 0),
        living_allowance: Number(form.living_allowance || 0),
        special_allowance: Number(form.special_allowance || 0),
        fuel_allowance: Number(form.fuel_allowance || 0),
        incentive_type: form.incentive_type,
        incentive_amount: Number(form.incentive_amount || 0),
        oc: form.oc || null,
        phone_allowance: Number(form.phone_allowance || 0),
        employment_type_id: form.employment_type_id,
        role_id: form.role_id,
      };

      // console.log("SAVE PAYLOAD:", payload);

      const res = await fetch(
        "/recruitment/api/approve_employees/employee-master/update",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.message || "ไม่สามารถบันทึกข้อมูลได้"
        );
      }

      message.success("บันทึกข้อมูลเรียบร้อยแล้ว");

      // ถ้าต้องการกลับหน้ารายการ
      // router.push("/recruitment/approve_employees");

    } catch (error) {
      console.error("SAVE EMPLOYEE ERROR:", error);

      message.error(
        error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
      );
    }
  }

  useEffect(() => {
    if (!isChecking && !canEdit) {
      router.replace("/recruitment/approve_employees");
    }
  }, [isChecking, canEdit, router]);

  // ยังโหลดอยู่ (ไม่ว่าจะเช็คสิทธิ์หรือโหลดข้อมูล) -> แสดง loading เท่านั้น ห้ามไปต่อ
  if (isChecking || loading) return <LoadingOrb />;
  // if (!canEdit) return null;

  // โหลดเสร็จแล้วแต่ไม่มีข้อมูล/error -> หยุดที่นี่ ห้ามไปต่อ
  if (error || !data) {
    return notFound();
  }

  console.log(data?.interviews);
  

  // ============================
  // Layout
  // ============================
  return (
    <div>
      <div>
        <CandidateDetail
          application={data?.application}
          education={data?.education}
          workExperience={data?.workExperience}
          languageSkills={data?.languageSkills}
          systemProgramSkills={data?.systemProgramSkills}
          documents={data?.documents}
          interviews={data?.interviews?.[0]}
        />
      </div>
      <div style={{ padding: 24 }}>
        <Card
          title="ข้อมูลตำแหน่ง"
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[16, 16]}>

            {/* Branch */}
            <Col xs={24} md={12} lg={8}>
              <div>
                <Text strong>Branch</Text>

                <Select
                  style={{ width: "100%", marginTop: 6 }}
                  placeholder="เลือก Branch"
                  value={form.branch_id}
                  onChange={handleBranchChange}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={master.branches.map((item) => ({
                    value: item.id,
                    label: item.branch_name,
                  }))}
                />
              </div>
            </Col>

            {/* Department */}
            <Col xs={24} md={12} lg={8}>
              <div>
                <Text strong>Department</Text>

                <Select
                  style={{ width: "100%", marginTop: 6 }}
                  placeholder="เลือก Department"
                  value={form.department_id}
                  onChange={handleDepartmentChange}
                  disabled={!form.branch_id}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={master.departments.map((item) => ({
                    value: item.id,
                    label: item.department_name,
                  }))}
                />
              </div>
            </Col>

            {/* Division */}
            <Col xs={24} md={12} lg={8}>
              <div>
                <Text strong>Division</Text>

                <Select
                  style={{ width: "100%", marginTop: 6 }}
                  placeholder="เลือก Division"
                  value={form.division_id}
                  onChange={handleDivisionChange}
                  disabled={!form.department_id}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={master.divisions.map((item) => ({
                    value: item.id,
                    label: item.division_name,
                  }))}
                />
              </div>
            </Col>

            {/* Unit */}
            <Col xs={24} md={12} lg={8}>
              <div>
                <Text strong>Unit</Text>

                <Select
                  style={{ width: "100%", marginTop: 6 }}
                  placeholder="เลือก Unit"
                  value={form.unit_id}
                  onChange={handleUnitChange}
                  disabled={!form.division_id}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={master.units.map((item) => ({
                    value: item.id,
                    label: item.unit_name,
                  }))}
                />
              </div>
            </Col>

            {/* Position */}
            <Col xs={24} md={12} lg={8}>
              <div>
                <Text strong>Position</Text>

                <Select
                  style={{ width: "100%", marginTop: 6 }}
                  placeholder="เลือก Position"
                  value={form.position_id}
                  onChange={handlePositionChange}
                  disabled={!form.unit_id}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={master.positions.map((item) => ({
                    value: item.id,
                    label: item.position_name,
                  }))}
                />
              </div>
            </Col>

            {/* Position Level */}
            <Col xs={24} md={12} lg={8}>
              <div>
                <Text strong>Position Level</Text>

                <Select
                  style={{ width: "100%", marginTop: 6 }}
                  placeholder="เลือก Position Level"
                  value={form.position_level_id}
                  onChange={(value) =>
                    updateForm("position_level_id", value)
                  }
                  disabled={!form.position_id}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={master.position_levels.map((item) => ({
                    value: item.id,
                    label: item.level_code,
                  }))}
                />
              </div>
            </Col>

          </Row>
        </Card>

        <Card
          title="ข้อมูลการเริ่มงาน"
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} lg={8}>
              <Text strong>วันที่เริ่มทำงาน</Text>

              <DatePicker
                style={{
                  width: "100%",
                  marginTop: 6,
                }}
                value={
                  form.start_date
                    ? dayjs(form.start_date)
                    : null
                }
                onChange={(date) =>
                  updateForm("start_date", date)
                }
                format="DD/MM/YYYY"
              />
            </Col>
          </Row>
        </Card>

        <Card
          title="ข้อมูลค่าตอบแทน"
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[16, 16]}>

            {/* Base Salary */}
            <Col xs={24} md={12} lg={8}>
              <Text strong>ฐานเงินเดือน</Text>

              <InputNumber
                style={{
                  width: "100%",
                  marginTop: 6,
                }}
                min={0}
                precision={2}
                value={form.base_salary}
                onChange={(value) =>
                  updateForm("base_salary", value || 0)
                }
                formatter={(value) =>
                  `${value}`.replace(
                    /\B(?=(\d{3})+(?!\d))/g,
                    ","
                  )
                }
                parser={(value) =>
                  value?.replace(/,/g, "") || 0
                }
              />
            </Col>

            {/* Position Allowance */}
            <Col xs={24} md={12} lg={8}>
              <Text strong>ค่าตำแหน่ง</Text>

              <InputNumber
                style={{
                  width: "100%",
                  marginTop: 6,
                }}
                min={0}
                precision={2}
                value={form.position_allowance}
                onChange={(value) =>
                  updateForm(
                    "position_allowance",
                    value || 0
                  )
                }
              />
            </Col>

            {/* Living Allowance */}
            <Col xs={24} md={12} lg={8}>
              <Text strong>ค่าครองชีพ</Text>

              <InputNumber
                style={{
                  width: "100%",
                  marginTop: 6,
                }}
                min={0}
                precision={2}
                value={form.living_allowance}
                onChange={(value) =>
                  updateForm(
                    "living_allowance",
                    value || 0
                  )
                }
              />
            </Col>

            {/* Special Allowance */}
            <Col xs={24} md={12} lg={8}>
              <Text strong>ค่าตอบแทนพิเศษ</Text>

              <InputNumber
                style={{
                  width: "100%",
                  marginTop: 6,
                }}
                min={0}
                precision={2}
                value={form.special_allowance}
                onChange={(value) =>
                  updateForm(
                    "special_allowance",
                    value || 0
                  )
                }
              />
            </Col>

            {/* Fuel */}
            <Col xs={24} md={12} lg={8}>
              <Text strong>ค่าน้ำมัน</Text>

              <InputNumber
                style={{
                  width: "100%",
                  marginTop: 6,
                }}
                min={0}
                precision={2}
                value={form.fuel_allowance}
                onChange={(value) =>
                  updateForm(
                    "fuel_allowance",
                    value || 0
                  )
                }
              />
            </Col>

            {/* Total */}
            <Col xs={24} md={12} lg={8}>
              <Text strong>เงินเดือนรวม</Text>

              <InputNumber
                style={{
                  width: "100%",
                  marginTop: 6,
                }}
                value={totalSalary}
                disabled
                formatter={(value) =>
                  `${value}`.replace(
                    /\B(?=(\d{3})+(?!\d))/g,
                    ","
                  )
                }
              />
            </Col>

          </Row>
        </Card>

        <Card
          title="Incentive"
          style={{ marginBottom: 16 }}
        >
          <Radio.Group
            value={form.incentive_type}
            onChange={(e) => {
              const value = e.target.value;

              setForm((prev) => ({
                ...prev,
                incentive_type: value,
                incentive_amount:
                  value === "KPIs"
                    ? prev.incentive_amount
                    : 0,
              }));
            }}
          >
            <Space wrap>
              <Radio value="Restaurant"> Restaurant </Radio>
              <Radio value="Commission"> Commission </Radio>
              <Radio value="Activity"> Activity </Radio>
              <Radio value="Fixed"> Fixed </Radio>
              <Radio value="KPIs"> KPIs </Radio>
            </Space>
          </Radio.Group>

          {form.incentive_type === "KPIs" && (
            <div style={{ marginTop: 16 }}>
              <Text strong>
                จำนวนเงิน KPIs
              </Text>

              <InputNumber
                style={{
                  width: 300,
                  marginTop: 6,
                  display: "block",
                }}
                min={0}
                precision={2}
                value={form.incentive_amount}
                onChange={(value) =>
                  updateForm(
                    "incentive_amount",
                    value || 0
                  )
                }
              />
            </div>
          )}
        </Card>

        <Card
          title="ข้อมูลเพิ่มเติม"
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[16, 16]}>

            <Col xs={24} md={12} lg={8}>
              <Text strong>OC</Text>

              <InputNumber
                style={{
                  width: "100%",
                  marginTop: 6,
                }}
                min={0}
                precision={2}
                value={form.oc}
                onChange={(value) =>
                  updateForm(
                    "oc",
                    value || 0
                  )
                }
              />
            </Col>

            <Col xs={24} md={12} lg={8}>
              <Text strong>ค่าโทรศัพท์</Text>

              <InputNumber
                style={{
                  width: "100%",
                  marginTop: 6,
                }}
                min={0}
                precision={2}
                value={form.phone_allowance}
                onChange={(value) =>
                  updateForm(
                    "phone_allowance",
                    value || 0
                  )
                }
              />
            </Col>

          </Row>
        </Card>

        <Card
          title="ข้อมูลการจ้างงาน"
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[16, 16]}>

            {/* Employment Type */}
            <Col xs={24} md={12} lg={8}>
              <Text strong>
                ประเภทการจ้างงาน
              </Text>

              <Select
                style={{
                  width: "100%",
                  marginTop: 6,
                }}
                placeholder="เลือกประเภทการจ้างงาน"
                value={form.employment_type_id}
                onChange={(value) =>
                  updateForm(
                    "employment_type_id",
                    value
                  )
                }
                allowClear
                showSearch
                optionFilterProp="label"
                options={master.employment_types.map(
                  (item) => ({
                    value: item.id,
                    label: item.type_name,
                  })
                )}
              />
            </Col>

            {/* Role */}
            <Col xs={24} md={12} lg={8}>
              <Text strong>
                Role
              </Text>

              <Select
                style={{
                  width: "100%",
                  marginTop: 6,
                }}
                placeholder="เลือก Role"
                value={form.role_id}
                onChange={(value) =>
                  updateForm("role_id", value)
                }
                allowClear
                showSearch
                optionFilterProp="label"
                options={master.roles.map(
                  (item) => ({
                    value: item.id,
                    label: item.role_name,
                  })
                )}
              />
            </Col>

          </Row>
        </Card>

        <Card>
          <div className="flex justify-center gap-4" >
              <Button onClick={() => router.back()} > ยกเลิก </Button>
              <Button
                type="primary"
                onClick={handleSave}
              >
                บันทึก
              </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}