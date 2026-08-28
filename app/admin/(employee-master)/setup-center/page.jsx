"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Flex,
} from "antd";

import {
  useRouter,
} from "next/navigation";

import LoadingOrb from "@/app/components/LoadingOrb";

import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";

import {
  swalError,
} from "@/components/Swal";

import {
  useAuth,
} from "@/contexts/AuthContext";

import SetupCenterOverview from "./components/SetupCenterOverview";
import NextSetupActionCard from "./components/NextSetupActionCard";
import SetupStepCard from "./components/SetupStepCard";
import EmployeeNextActions from "./components/EmployeeNextActions";
import FirstTimeGuide from "./components/FirstTimeGuide";
import RestartGuidedTourButton from "./components/RestartGuidedTourButton";

/* =========================================================
   Helpers
========================================================= */

async function readJsonResponse(
  response
) {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function normalizePermissions(
  user
) {
  const permissions =
    Array.isArray(
      user?.permissions
    )
      ? user.permissions
      : [];

  return new Set(
    permissions.map(
      (item) =>
        typeof item ===
        "string"
          ? item
          : item
              ?.permission_code
    ).filter(Boolean)
  );
}

/* =========================================================
   Page
========================================================= */

export default function SetupCenterPage() {
  const router =
    useRouter();

  const {
    user,
    loadingUser,
  } =
    useAuth();

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    steps,
    setSteps,
  ] =
    useState([]);

  const [
    readiness,
    setReadiness,
  ] =
    useState({
      employee_ready:
        false,
      p0_ready:
        false,
      overall_percent:
        0,
      required_total:
        0,
      required_ready:
        0,
      next_required_action:
        null,
    });

  const [
    tableHealth,
    setTableHealth,
  ] =
    useState([]);

  const [
    firstTimeMode,
    setFirstTimeMode,
  ] =
    useState(
      "migration"
    );

  const permissionSet =
    useMemo(
      () =>
        normalizePermissions(
          user
        ),
      [
        user,
      ]
    );

  const isSuperAdmin =
    user?.role ===
      "SUPER_ADMIN" ||
    user?.role_code ===
      "SUPER_ADMIN";

  const canAccess =
    useCallback(
      (permission) => {
        if (!permission) {
          return true;
        }

        if (isSuperAdmin) {
          return true;
        }

        return permissionSet.has(
          permission
        );
      },
      [
        isSuperAdmin,
        permissionSet,
      ]
    );

  const canViewSetupCenter =
    canAccess(
      "system.setup_center.view"
    );

  const loadSetupCenter =
    useCallback(
      async () => {
        if (
          !canViewSetupCenter
        ) {
          return;
        }

        try {
          setLoading(true);

          const response =
            await fetch(
              "/api/admin/setup-center",
              {
                cache:
                  "no-store",
              }
            );

          const json =
            await readJsonResponse(
              response
            );

          if (
            !response.ok ||
            !json.success
          ) {
            throw new Error(
              json.error ||
                "ไม่สามารถตรวจสอบ Setup Center ได้"
            );
          }

          setSteps(
            Array.isArray(
              json.data
                ?.steps
            )
              ? json.data
                  .steps
              : []
          );

          setReadiness(
            json.data
              ?.readiness ||
              {
                employee_ready:
                  false,
                p0_ready:
                  false,
                overall_percent:
                  0,
                required_total:
                  0,
                required_ready:
                  0,
                next_required_action:
                  null,
              }
          );

          setTableHealth(
            Array.isArray(
              json.data
                ?.table_health
            )
              ? json.data
                  .table_health
              : []
          );
        } catch (error) {
          console.error(
            "LOAD_SETUP_CENTER_ERROR:",
            error
          );

          swalError(
            error.message ||
              "ไม่สามารถตรวจสอบความพร้อมของระบบได้"
          );
        } finally {
          setLoading(false);
        }
      },
      [
        canViewSetupCenter,
      ]
    );

  useEffect(() => {
    if (loadingUser) {
      return;
    }

    if (!user) {
      router.replace(
        "/login"
      );

      return;
    }

    if (
      !canViewSetupCenter
    ) {
      router.replace(
        "/admin"
      );
    }
  }, [
    loadingUser,
    user,
    canViewSetupCenter,
    router,
  ]);

  useEffect(() => {
    if (
      loadingUser ||
      !user ||
      !canViewSetupCenter
    ) {
      return;
    }

    loadSetupCenter();
  }, [
    loadingUser,
    user,
    canViewSetupCenter,
    loadSetupCenter,
  ]);

  const nextAccessibleAction =
    useMemo(
      () => {
        for (
          const step of
            steps
        ) {
          const item =
            (
              step.items ||
              []
            ).find(
              (candidate) =>
                candidate.required &&
                !candidate.ready &&
                canAccess(
                  candidate.permission
                )
            );

          if (item) {
            return {
              ...item,
              step_key:
                step.key,
              step_order:
                step.order,
              step_title:
                step.title,
              priority:
                step.priority,
            };
          }
        }

        return (
          readiness.next_required_action ||
          null
        );
      },
      [
        steps,
        readiness.next_required_action,
        canAccess,
      ]
    );

  function openItem(
    item
  ) {
    if (
      !item?.href
    ) {
      return;
    }

    router.push(
      item.href
    );
  }

  if (loadingUser) {
    return (
      <LoadingOrb />
    );
  }

  if (
    !user ||
    !canViewSetupCenter
  ) {
    return null;
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth:
          "100%",
        minWidth: 0,
        overflowX:
          "hidden",
      }}
    >
      <MasterLayout
        header={
          <>
            <MasterPageHeader
              title="ศูนย์เริ่มต้นใช้งาน"
              subtitle="HRMS Setup Center"
              loading={
                loading
              }
              canRefresh
              canCreate={
                false
              }
              onRefresh={
                loadSetupCenter
              }
            />

            <PageInfoAlert
              description="ใช้หน้านี้เป็นลำดับนำทางสำหรับการตั้งระบบครั้งแรก Sidebar ยังเป็นเมนูสำหรับผู้ใช้ที่รู้ปลายทางแล้ว ส่วน Setup Center จะบอกว่าอะไรต้องทำก่อน อะไรพร้อมแล้ว และควรไปหน้าไหนต่อ"
            />
          </>
        }

        search={
          <Flex
            vertical
            gap={12}
            style={{
              width: "100%",
            }}
          >
            <Flex
              justify="end"
            >
              <RestartGuidedTourButton />
            </Flex>

            <FirstTimeGuide
              mode={
                firstTimeMode
              }
              onModeChange={
                setFirstTimeMode
              }
              employeeReady={
                readiness.employee_ready
              }
              canOpenEmployee={
                canAccess(
                  "ems.employees.view"
                )
              }
              canOpenImport={
                canAccess(
                  "data.import.view"
                )
              }
              onOpenEmployee={() =>
                router.push(
                  "/admin/employees"
                )
              }
              onOpenImport={() =>
                router.push(
                  "/admin/data-import"
                )
              }
            />
          </Flex>
        }

        summary={
          <SetupCenterOverview
            readiness={
              readiness
            }
          />
        }

        table={
          <Flex
            vertical
            gap={18}
            style={{
              width: "100%",
              minWidth: 0,
            }}
          >
            <NextSetupActionCard
              action={
                nextAccessibleAction
              }
              canOpen={
                nextAccessibleAction
                  ? canAccess(
                      nextAccessibleAction.permission
                    )
                  : false
              }
              onOpen={() =>
                openItem(
                  nextAccessibleAction
                )
              }
            />

            {tableHealth.length >
              0 && (
              <Alert
                type="warning"
                showIcon
                title="บาง Module ยังไม่มีตารางหรือยังไม่พร้อม"
                description={`Setup Center ข้ามการนับ ${tableHealth.length} ตารางที่ Query ไม่ได้ โดยหน้าที่เหลือยังใช้งานได้ตามปกติ`}
              />
            )}

            {steps.map(
              (step) => (
                <SetupStepCard
                  key={
                    step.key
                  }
                  step={step}
                  canAccess={
                    canAccess
                  }
                  onOpen={
                    openItem
                  }
                />
              )
            )}

            <EmployeeNextActions
              canAccess={
                canAccess
              }
              onOpen={
                openItem
              }
            />
          </Flex>
        }
      />
    </div>
  );
}
