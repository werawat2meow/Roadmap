"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Form,
  message,
} from "antd";

import {
  useRouter,
} from "next/navigation";

import {
  useAuth,
} from "@/contexts/AuthContext";

import {
  hasPermission,
} from "@/lib/permissions";

import {
  FileProtectOutlined,
} from "@ant-design/icons";

import LoadingOrb from "@/app/components/LoadingOrb";

import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";

import BenefitPolicyRuleSearch from "./components/BenefitPolicyRuleSearch";
import BenefitPolicyRuleSummaryCards from "./components/BenefitPolicyRuleSummaryCards";
import BenefitPolicyRuleTable from "./components/BenefitPolicyRuleTable";
import BenefitPolicyRuleModal from "./components/BenefitPolicyRuleModal";

const DEFAULT_PAGE_SIZE = 20;
const CURRENT_YEAR = new Date().getFullYear();

const DEFAULT_FORM_VALUES = {
  benefit_id: undefined,

  policy_code: "",
  policy_name: "",
  rule_year: CURRENT_YEAR,

  company_id: undefined,
  branch_id: undefined,
  department_id: undefined,
  division_id: undefined,
  unit_id: undefined,

  position_level: undefined,
  employment_type_id: undefined,
  employee_status_id: undefined,

  min_service_months: 0,
  max_service_months: undefined,

  min_age: undefined,
  max_age: undefined,

  probation_required: false,

  quota_amount: 0,
  quota_unit: "amount",
  quota_frequency: "yearly",

  is_unlimited: false,
  priority: 100,
  is_active: true,
};

function normalizeMasters(masters) {
  return {
    benefits:
      masters?.benefits || [],
    companies:
      masters?.companies || [],
    branches:
      masters?.branches || [],
    departments:
      masters?.departments || [],
    divisions:
      masters?.divisions || [],
    units:
      masters?.units || [],
    positionLevels:
      masters?.positionLevels || [],
    employmentTypes:
      masters?.employmentTypes || [],
    employeeStatuses:
      masters?.employeeStatuses || [],
  };
}

export default function BenefitPolicyRulesPage() {
  const router =
    useRouter();

  const {
    user,
    loadingUser,
  } =
    useAuth();

  const [form] =
    Form.useForm();

  /* =========================================================
     Permission
  ========================================================= */

  const canView =
    hasPermission(
      user,
      "benefits.policy_rules.view"
    );

  const canCreate =
    hasPermission(
      user,
      "benefits.policy_rules.create"
    );

  const canEdit =
    hasPermission(
      user,
      "benefits.policy_rules.edit"
    );

  const canDelete =
    hasPermission(
      user,
      "benefits.policy_rules.delete"
    );

  /* =========================================================
     State
  ========================================================= */

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    rows,
    setRows,
  ] =
    useState([]);

  const [
    summary,
    setSummary,
  ] =
    useState({
      total: 0,
      active: 0,
      inactive: 0,
      unlimited: 0,
    });

  const [
    masters,
    setMasters,
  ] =
    useState(
      normalizeMasters()
    );

  const [
    page,
    setPage,
  ] =
    useState(1);

  const [
    pageSize,
    setPageSize,
  ] =
    useState(
      DEFAULT_PAGE_SIZE
    );

  const [
    total,
    setTotal,
  ] =
    useState(0);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] =
    useState("");

  const [
    year,
    setYear,
  ] =
    useState(
      CURRENT_YEAR
    );

  const [
    benefitId,
    setBenefitId,
  ] =
    useState();

  const [
    status,
    setStatus,
  ] =
    useState();

  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(false);

  const [
    modalMode,
    setModalMode,
  ] =
    useState("create");

  const [
    selected,
    setSelected,
  ] =
    useState(null);

  /* =========================================================
     Permission redirect
  ========================================================= */

  useEffect(() => {
    if (
      loadingUser
    ) {
      return;
    }

    if (!user) {
      router.replace(
        "/login"
      );

      return;
    }

    if (!canView) {
      router.replace(
        "/admin"
      );
    }
  }, [
    loadingUser,
    user,
    canView,
    router,
  ]);

  /* =========================================================
     Load
  ========================================================= */

  const loadData =
    useCallback(
      async ({
        nextPage = page,
        nextPageSize =
          pageSize,
        nextSearch =
          search,
        nextYear =
          year,
        nextBenefitId =
          benefitId,
        nextStatus =
          status,
      } = {}) => {
        if (!canView) {
          return;
        }

        try {
          setLoading(
            true
          );

          const params =
            new URLSearchParams();

          params.set(
            "page",
            String(
              nextPage
            )
          );

          params.set(
            "pageSize",
            String(
              nextPageSize
            )
          );

          if (
            nextSearch?.trim()
          ) {
            params.set(
              "search",
              nextSearch.trim()
            );
          }

          if (
            nextYear
          ) {
            params.set(
              "year",
              String(
                nextYear
              )
            );
          }

          if (
            nextBenefitId
          ) {
            params.set(
              "benefit_id",
              String(
                nextBenefitId
              )
            );
          }

          if (
            nextStatus !==
              undefined &&
            nextStatus !==
              null &&
            nextStatus !==
              ""
          ) {
            params.set(
              "active",
              String(
                nextStatus
              )
            );
          }

          const response =
            await fetch(
              `/api/admin/benefit-policy-rules?${params.toString()}`,
              {
                cache:
                  "no-store",
              }
            );

          const payload =
            await response
              .json()
              .catch(
                () => ({})
              );

          if (
            !response.ok
          ) {
            throw new Error(
              payload?.error ||
                payload?.message ||
                "ไม่สามารถโหลดกฎเกณฑ์สวัสดิการได้"
            );
          }

          setRows(
            payload?.data ||
              []
          );

          setSummary({
            total:
              payload?.summary
                ?.total ||
              0,

            active:
              payload?.summary
                ?.active ||
              0,

            inactive:
              payload?.summary
                ?.inactive ||
              0,

            unlimited:
              payload?.summary
                ?.unlimited ||
              0,
          });

          setTotal(
            payload
              ?.pagination
              ?.total ||
              0
          );

          setMasters(
            normalizeMasters(
              payload?.masters
            )
          );

          setPage(
            nextPage
          );

          setPageSize(
            nextPageSize
          );
        } catch (
          error
        ) {
          console.error(
            "LOAD_BENEFIT_POLICY_RULES_ERROR:",
            error
          );

          message.error(
            error?.message ||
              "ไม่สามารถโหลดกฎเกณฑ์สวัสดิการได้"
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        canView,
        page,
        pageSize,
        search,
        year,
        benefitId,
        status,
      ]
    );

  /* =========================================================
     Auto Search / Filter
     - Search text: debounce 400ms
     - Year / Benefit / Status: load immediately
     - ไม่แก้ logic ของ loadData เดิม
  ========================================================= */

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          setDebouncedSearch(
            search.trim()
          );

          setPage(1);
        },
        400
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    search,
  ]);

  useEffect(() => {
    if (!canView) {
      return;
    }

    loadData({
      nextPage: 1,
      nextSearch:
        debouncedSearch,
      nextYear:
        year,
      nextBenefitId:
        benefitId,
      nextStatus:
        status,
    });
  }, [
    canView,
    debouncedSearch,
    year,
    benefitId,
    status,
  ]);

  /* =========================================================
     Options
  ========================================================= */

  const benefitOptions =
    useMemo(
      () =>
        (
          masters
            .benefits ||
          []
        ).map(
          (item) => ({
            value:
              item.id,

            label:
              item
                .benefit_code
                ? `${item.benefit_code} - ${
                    item.benefit_name ||
                    "-"
                  }`
                : item.benefit_name ||
                  "-",
          })
        ),
      [
        masters
          .benefits,
      ]
    );

  /* =========================================================
     Modal
  ========================================================= */

  const openCreate =
    () => {
      if (!canCreate) {
        return;
      }

      setSelected(
        null
      );

      setModalMode(
        "create"
      );

      form.resetFields();

      form.setFieldsValue(
        DEFAULT_FORM_VALUES
      );

      setModalOpen(
        true
      );
    };

  const openView =
    (record) => {
      setSelected(
        record
      );

      setModalMode(
        "view"
      );

      form.resetFields();

      form.setFieldsValue({
        ...DEFAULT_FORM_VALUES,
        ...record,

        max_service_months:
          record
            ?.max_service_months ??
          undefined,

        min_age:
          record
            ?.min_age ??
          undefined,

        max_age:
          record
            ?.max_age ??
          undefined,
      });

      setModalOpen(
        true
      );
    };

  const openEdit =
    (record) => {
      if (!canEdit) {
        return;
      }

      setSelected(
        record
      );

      setModalMode(
        "edit"
      );

      form.resetFields();

      form.setFieldsValue({
        ...DEFAULT_FORM_VALUES,
        ...record,

        max_service_months:
          record
            ?.max_service_months ??
          undefined,

        min_age:
          record
            ?.min_age ??
          undefined,

        max_age:
          record
            ?.max_age ??
          undefined,
      });

      setModalOpen(
        true
      );
    };

  const closeModal =
    () => {
      if (saving) {
        return;
      }

      setModalOpen(
        false
      );

      setSelected(
        null
      );

      setModalMode(
        "create"
      );

      form.resetFields();
    };

  /* =========================================================
     Save
  ========================================================= */

  const handleSave =
    async () => {
      const isEdit =
        modalMode ===
        "edit";

      if (
        isEdit &&
        !canEdit
      ) {
        return;
      }

      if (
        !isEdit &&
        !canCreate
      ) {
        return;
      }

      try {
        const values =
          await form.validateFields();

        setSaving(
          true
        );

        const response =
          await fetch(
            "/api/admin/benefit-policy-rules",
            {
              method:
                isEdit
                  ? "PATCH"
                  : "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  id:
                    selected?.id ||
                    undefined,

                  ...values,

                  policy_code:
                    String(
                      values
                        ?.policy_code ||
                        ""
                    )
                      .trim()
                      .toUpperCase(),
                }),
            }
          );

        const payload =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (
          !response.ok
        ) {
          throw new Error(
            payload?.error ||
              payload?.message ||
              "ไม่สามารถบันทึกกฎเกณฑ์สวัสดิการได้"
          );
        }

        message.success(
          isEdit
            ? "แก้ไขกฎเกณฑ์สวัสดิการเรียบร้อยแล้ว"
            : "เพิ่มกฎเกณฑ์สวัสดิการเรียบร้อยแล้ว"
        );

        closeModal();

        await loadData();
      } catch (
        error
      ) {
        if (
          error?.errorFields
        ) {
          return;
        }

        console.error(
          "SAVE_BENEFIT_POLICY_RULE_ERROR:",
          error
        );

        message.error(
          error?.message ||
            "ไม่สามารถบันทึกกฎเกณฑ์สวัสดิการได้"
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =========================================================
     Delete
  ========================================================= */

  const handleDelete =
    async (
      record
    ) => {
      if (!canDelete) {
        return;
      }

      try {
        const response =
          await fetch(
            `/api/admin/benefit-policy-rules?id=${encodeURIComponent(
              record.id
            )}`,
            {
              method:
                "DELETE",
            }
          );

        const payload =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (
          !response.ok
        ) {
          throw new Error(
            payload?.error ||
              payload?.message ||
              "ไม่สามารถลบกฎเกณฑ์สวัสดิการได้"
          );
        }

        message.success(
          "ลบกฎเกณฑ์สวัสดิการเรียบร้อยแล้ว"
        );

        const nextPage =
          rows.length ===
            1 &&
          page > 1
            ? page - 1
            : page;

        await loadData({
          nextPage,
        });
      } catch (
        error
      ) {
        console.error(
          "DELETE_BENEFIT_POLICY_RULE_ERROR:",
          error
        );

        message.error(
          error?.message ||
            "ไม่สามารถลบกฎเกณฑ์สวัสดิการได้"
        );
      }
    };

  /* =========================================================
     Loading auth
  ========================================================= */

  if (
    loadingUser ||
    !user ||
    !canView
  ) {
    return (
      <LoadingOrb />
    );
  }

  return (
    <MasterLayout
      header={
        <>
          <MasterPageHeader
            icon={
              <FileProtectOutlined className="text-blue-600" />
            }
            title="กฎเกณฑ์สวัสดิการ (Policy Rules)"
            subtitle="กำหนดเงื่อนไขการได้รับสิทธิ์สวัสดิการของพนักงาน"
            loading={loading}
            canRefresh
            canCreate={canCreate}
            createText="เพิ่ม Policy"
            onRefresh={() =>
              loadData()
            }
            onCreate={
              openCreate
            }
          />

          <PageInfoAlert
            title="ตั้ง Policy Rules ก่อนให้ระบบสร้างสิทธิ์สวัสดิการพนักงาน"
            description="ระบบจะนำกฎที่ Active ไปใช้เป็นเงื่อนไขสำหรับประเมินสิทธิ์ (Entitlements) ของพนักงาน โดยเงื่อนไขที่เว้นว่างหมายถึงไม่จำกัดในระดับนั้น"
          />
        </>
      }

      summary={
        <BenefitPolicyRuleSummaryCards
          summary={summary}
        />
      }

      search={
        <BenefitPolicyRuleSearch
          search={search}
          setSearch={setSearch}
          year={year}
          setYear={setYear}
          benefitId={benefitId}
          setBenefitId={setBenefitId}
          status={status}
          setStatus={setStatus}
          benefitOptions={benefitOptions}
          loading={loading}

          /*
          * ถ้าใช้ปุ่มเพิ่มด้าน Header แล้ว
          * ไม่ต้องแสดงปุ่มเพิ่มใน Search อีก
          */
          canCreate={false}

          onSearch={() =>
            loadData({
              nextPage: 1,
            })
          }

          onReset={() => {
            setSearch("");
            setYear(
              CURRENT_YEAR
            );
            setBenefitId(
              undefined
            );
            setStatus(
              undefined
            );

            loadData({
              nextPage: 1,
              nextSearch: "",
              nextYear:
                CURRENT_YEAR,
              nextBenefitId:
                undefined,
              nextStatus:
                undefined,
            });
          }}

          onCreate={
            openCreate
          }
        />
      }

      table={
        <BenefitPolicyRuleTable
          loading={loading}
          data={rows}
          page={page}
          pageSize={pageSize}
          total={total}
          canView={canView}
          canEdit={canEdit}
          canDelete={canDelete}
          onView={openView}
          onEdit={openEdit}
          onDelete={handleDelete}
          onChange={(
            nextPage,
            nextPageSize
          ) => {
            loadData({
              nextPage,
              nextPageSize,
            });
          }}
        />
      }
    >
      <BenefitPolicyRuleModal
        open={modalOpen}
        mode={modalMode}
        form={form}
        loading={saving}
        masters={masters}
        onCancel={closeModal}
        onSubmit={handleSave}
      />
    </MasterLayout>
  );
}
