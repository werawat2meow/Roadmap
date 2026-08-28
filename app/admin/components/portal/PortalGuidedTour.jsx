"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Button,
  Flex,
  Tour,
  Typography,
} from "antd";

import {
  ArrowRightOutlined,
  CompassOutlined,
  SettingOutlined,
} from "@ant-design/icons";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  useAuth,
} from "@/contexts/AuthContext";

const {
  Text,
} = Typography;

/* =========================================================
   Tour Config
========================================================= */

const TOUR_CODE = "portal_intro";

const TOUR_VERSION =1;

/* =========================================================
   DOM Helpers
========================================================= */

function findElementByText(
  selector,
  texts = []
) {
  if (
    typeof document ===
    "undefined"
  ) {
    return null;
  }

  const normalized =
    texts
      .map((item) =>
        String(item)
          .trim()
          .toLowerCase()
      )
      .filter(Boolean);

  const elements =
    document.querySelectorAll(
      selector
    );

  for (
    const element of
      elements
  ) {
    const content =
      String(
        element.textContent ||
          ""
      )
        .trim()
        .toLowerCase();

    const matched =
      normalized.some(
        (text) =>
          content.includes(
            text
          )
      );

    if (matched) {
      return element;
    }
  }

  return null;
}

/* =========================================================
   Target: Sidebar
========================================================= */

function getSidebarTarget() {
  if (
    typeof document ===
    "undefined"
  ) {
    return null;
  }

  return (
    document.querySelector(
      '[data-tour="sidebar"]'
    ) ||
    document.querySelector(
      ".sidebar-scroll"
    ) ||
    document.querySelector(
      "aside"
    )
  );
}

/* =========================================================
   Target: Employee & Structure
========================================================= */

function getEmployeeTarget() {
  if (
    typeof document ===
    "undefined"
  ) {
    return null;
  }

  return (
    document.querySelector(
      '[data-tour="employee-structure"]'
    ) ||
    findElementByText(
      "button",
      [
        "employee-structure",
        "พนักงาน & โครงสร้าง",
      ]
    )
  );
}

/* =========================================================
   Target: Payroll
========================================================= */

function getPayrollTarget() {
  if (
    typeof document ===
    "undefined"
  ) {
    return null;
  }

  return (
    document.querySelector(
      '[data-tour="payroll-finance"]'
    ) ||
    findElementByText(
      "button",
      [
        "payroll & finance",
        "payroll",
      ]
    )
  );
}

/* =========================================================
   Target: System Settings / Setup Center
========================================================= */

function getSystemSettingsTarget() {
  if (
    typeof document ===
    "undefined"
  ) {
    return null;
  }

  return (
    document.querySelector(
      '[data-tour="setup-center"]'
    ) ||
    document.querySelector(
      '[data-tour="system-settings"]'
    ) ||
    findElementByText(
      "button",
      [
        "ศูนย์เริ่มต้นใช้งาน",
        "setup center",
        "ตั้งค่าระบบพื้นฐาน",
        "system settings",
      ]
    )
  );
}

/* =========================================================
   Permission Helpers
========================================================= */

function normalizePermissions(
  user
) {
  const list =
    Array.isArray(
      user?.permissions
    )
      ? user.permissions
      : [];

  return new Set(
    list
      .map((item) =>
        typeof item ===
        "string"
          ? item
          : item
              ?.permission_code
      )
      .filter(Boolean)
  );
}


/* =========================================================
   Tour Popup Container

   ให้ Popup อยู่ DOM Root เดียวกับ Target
   ป้องกัน Warning:
   trigger element and popup element
   should in same shadow root
========================================================= */

function getTourPopupContainer(
  triggerNode
) {
  if (
    typeof document ===
    "undefined"
  ) {
    return null;
  }

  /*
   * Step ที่ target = null
   * เช่น Welcome / Finish
   * ให้อยู่กลาง document ตามปกติ
   */
  if (!triggerNode) {
    return document.body;
  }

  /*
   * ตรวจ Root ของ Element ที่ Tour กำลังชี้
   */
  const rootNode =
    triggerNode.getRootNode?.();

  /*
   * ถ้า Target อยู่ใน ShadowRoot
   * ให้ Popup อยู่ Parent ของ Target
   * ซึ่งอยู่ Root เดียวกัน
   */
  if (
    typeof ShadowRoot !==
      "undefined" &&
    rootNode instanceof
      ShadowRoot
  ) {
    return (
      triggerNode.parentElement ||
      document.body
    );
  }

  /*
   * DOM ปกติ
   */
  return document.body;
}

/* =========================================================
   Component
========================================================= */

export default function PortalGuidedTour() {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const {
    user,
    loadingUser,
  } =
    useAuth();

  /* =======================================================
     State
  ======================================================= */

  const [
    open,
    setOpen,
  ] =
    useState(false);

  const [
    current,
    setCurrent,
  ] =
    useState(0);

  /*
   * สำคัญ:
   *
   * ใช้ useRef แทน useState
   * เพื่อกัน Effect ถูก cleanup
   * ตอนเปลี่ยน checked
   */
  // const checkedRef =
  //   useRef(false);

  /*
   * เก็บ Timer
   * เพื่อ clear ตอน unmount
   */
  const openTimerRef =
    useRef(null);

  /* =======================================================
     Permissions
  ======================================================= */

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
      (
        permission
      ) => {
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

  /* =======================================================
     API: Update Progress
  ======================================================= */

  const updateProgress =
    useCallback(
      async ({
        status,
        currentStep,
      }) => {
        try {
          const response =
            await fetch(
              "/api/admin/guided-tour",
              {
                method:
                  "PATCH",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    tour_code:
                      TOUR_CODE,

                    tour_version:
                      TOUR_VERSION,

                    status,

                    current_step:
                      Math.max(
                        Number(
                          currentStep ||
                            0
                        ),
                        0
                      ),
                  }),
              }
            );

          const payload =
            await response
              .json()
              .catch(
                () => ({})
              );

          if (!response.ok) {
            console.error(
              "GUIDED_TOUR_PROGRESS_API_ERROR:",
              payload
            );
          }

          return payload;
        } catch (error) {
          console.error(
            "UPDATE_GUIDED_TOUR_PROGRESS_ERROR:",
            error
          );

          return null;
        }
      },
      []
    );

  /* =======================================================
     Skip
  ======================================================= */

  const handleSkip =
    useCallback(
      async () => {
        setOpen(false);

        await updateProgress({
          status:
            "skipped",

          currentStep:
            current,
        });
      },
      [
        current,
        updateProgress,
      ]
    );

  /* =======================================================
     Finish
  ======================================================= */

  const handleFinish =
    useCallback(
      async () => {
        setOpen(false);

        await updateProgress({
          status:
            "completed",

          currentStep:
            current,
        });
      },
      [
        current,
        updateProgress,
      ]
    );

  /* =======================================================
     Go Setup Center
  ======================================================= */

  const goSetupCenter =
    useCallback(
      async () => {
        await updateProgress({
          status:
            "completed",

          currentStep:
            current,
        });

        setOpen(false);

        router.push(
          "/admin/setup-center"
        );
      },
      [
        current,
        router,
        updateProgress,
      ]
    );

  /* =======================================================
     Tour Steps
  ======================================================= */

  const steps =
    useMemo(
      () => {
        const renderSkipButton =
          () => (
            <Button
              type="link"
              size="small"
              onClick={
                handleSkip
              }
              style={{
                paddingInline:
                  0,
              }}
            >
              ข้ามการแนะนำ
            </Button>
          );

        const result = [
          /* ===============================================
             1. Welcome
          =============================================== */

          {
            title:
              "ยินดีต้อนรับเข้าสู่ HR System",

            description: (
              <Flex
                vertical
                gap={10}
              >
                <Text>
                  ระบบ HR System
                  ประกอบด้วยหลาย Module
                  สำหรับงานพนักงาน
                  โครงสร้างองค์กร Payroll
                  และการบริหารงาน HR
                </Text>

                <Text
                  type="secondary"
                >
                  การแนะนำนี้จะพาไปรู้จัก
                  ส่วนสำคัญของระบบก่อนเริ่มใช้งาน
                </Text>

                {renderSkipButton()}
              </Flex>
            ),

            /*
             * Step แรกไม่ผูก Element
             * Popup ต้องเปิดได้ทันที
             */
            target:
              null,

            icon:
              <CompassOutlined />,
          },

          /* ===============================================
             2. Workspace / Sidebar
          =============================================== */

          {
            title:
              "Workspace / เมนูหลัก",

            description: (
              <Flex
                vertical
                gap={10}
              >
                <Text>
                  เมนูด้านซ้ายคือ
                  Workspace หลักของระบบ
                  ใช้เข้าสู่ Module ต่าง ๆ
                </Text>

                <Text
                  type="secondary"
                >
                  ระบบจะแสดงเฉพาะเมนู
                  ที่บัญชีของคุณมี Permission
                </Text>

                {renderSkipButton()}
              </Flex>
            ),

            target:
              getSidebarTarget,

            placement:
              "right",
          },
        ];

        /* ===============================================
           3. Employee & Structure
        =============================================== */

        if (
          canAccess(
            "ems.employees.view"
          ) ||
          canAccess(
            "ems.companies.view"
          ) ||
          canAccess(
            "ems.org_structure.view"
          )
        ) {
          result.push({
            title:
              "Employee & Structure",

            description: (
              <Flex
                vertical
                gap={10}
              >
                <Text>
                  ส่วนนี้ใช้จัดการข้อมูล
                  พนักงานและโครงสร้างองค์กร
                </Text>

                <Text
                  type="secondary"
                >
                  เช่น บริษัท สังกัด แผนก
                  ตำแหน่ง Position Slot
                  และข้อมูล Employee
                </Text>

                {renderSkipButton()}
              </Flex>
            ),

            target:
              getEmployeeTarget,

            placement:
              "right",
          });
        }

        /* ===============================================
           4. Payroll & Finance
        =============================================== */

        if (
          canAccess(
            "ems.payroll_types.view"
          ) ||
          canAccess(
            "ems.employee_compensations.view"
          ) ||
          canAccess(
            "ems.payroll_runs.view"
          )
        ) {
          result.push({
            title:
              "Payroll & Finance",

            description: (
              <Flex
                vertical
                gap={10}
              >
                <Text>
                  ส่วนนี้ใช้สำหรับ
                  การตั้งค่าและประมวลผลเงินเดือน
                </Text>

                <Text
                  type="secondary"
                >
                  เช่น รอบการจ่าย
                  บริษัทเงินเดือน
                  สูตรคำนวณ Salary Structure
                  และ Payroll Run
                </Text>

                {renderSkipButton()}
              </Flex>
            ),

            target:
              getPayrollTarget,

            placement:
              "right",
          });
        }

        /* ===============================================
           5. Setup Center
        =============================================== */

        if (
          canAccess(
            "system.setup_center.view"
          )
        ) {
          result.push({
            title:
              "Setup Center",

            description: (
              <Flex
                vertical
                gap={10}
              >
                <Text>
                  ถ้าคุณกำลังเริ่มต้นใช้งาน
                  HR System เป็นครั้งแรก
                  แนะนำให้เริ่มจาก
                  Setup Center
                </Text>

                <Text
                  type="secondary"
                >
                  ระบบจะตรวจว่า Master ไหน
                  ตั้งค่าเรียบร้อยแล้ว
                  และควรทำขั้นตอนไหนต่อ
                </Text>

                {renderSkipButton()}
              </Flex>
            ),

            target:
              getSystemSettingsTarget,

            placement:
              "right",
          });
        }

        /* ===============================================
           Final
        =============================================== */

        result.push({
          title:
            "พร้อมเริ่มใช้งาน HR System",

          description: (
            <Flex
              vertical
              gap={12}
            >
              <Text>
                คุณสามารถเลือก Module
                จากเมนูด้านซ้าย
                เพื่อเริ่มทำงานได้ทันที
              </Text>

              {canAccess(
                "system.setup_center.view"
              ) && (
                <Text
                  type="secondary"
                >
                  หากไม่แน่ใจว่าควรเริ่มจากหน้าไหน
                  ให้เปิด Setup Center
                  เพื่อดู Checklist
                  และขั้นตอนแนะนำ
                </Text>
              )}

              <Flex
                gap={8}
                wrap="wrap"
              >
                {canAccess(
                  "system.setup_center.view"
                ) && (
                  <Button
                    type="primary"
                    icon={
                      <SettingOutlined />
                    }
                    onClick={
                      goSetupCenter
                    }
                  >
                    ไป Setup Center
                  </Button>
                )}

                <Button
                  icon={
                    <ArrowRightOutlined />
                  }
                  onClick={
                    handleFinish
                  }
                >
                  เริ่มใช้งานระบบ
                </Button>
              </Flex>
            </Flex>
          ),

          target:
            null,
        });

        return result;
      },
      [
        canAccess,
        goSetupCenter,
        handleFinish,
        handleSkip,
      ]
    );

  /* =======================================================
   Load Tour Status
======================================================= */

  useEffect(() => {
    if (
      loadingUser ||
      !user
    ) {
      return;
    }

    if (
      !pathname?.startsWith(
        "/admin"
      )
    ) {
      return;
    }

    let cancelled =
      false;

    let openTimer =
      null;

    async function loadStatus() {
      try {
        const params =
          new URLSearchParams({
            tour_code:
              TOUR_CODE,

            tour_version:
              String(
                TOUR_VERSION
              ),
          });

        const response =
          await fetch(
            `/api/admin/guided-tour?${params.toString()}`,
            {
              cache:
                "no-store",
            }
          );

        const json =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (cancelled) {
          return;
        }

        if (
          !response.ok ||
          !json.success
        ) {
          console.error(
            "GUIDED_TOUR_API_ERROR:",
            json
          );

          return;
        }

        console.log(
          "GUIDED_TOUR_STATUS:",
          json
        );

        /*
        * completed / skipped
        * = ไม่ต้องเปิด
        */
        if (
          !json.should_open
        ) {
          return;
        }

        const startStep =
          Math.max(
            Number(
              json.data
                ?.current_step ||
                0
            ),
            0
          );

        setCurrent(
          startStep
        );

        /*
        * บันทึก started
        */
        await updateProgress({
          status:
            "started",

          currentStep:
            startStep,
        });

        if (cancelled) {
          return;
        }

        /*
        * รอ Sidebar / Topbar Render
        */
        openTimer =
          window.setTimeout(
            () => {
              if (
                cancelled
              ) {
                return;
              }

              console.log(
                "GUIDED_TOUR_OPEN"
              );

              setOpen(
                true
              );
            },
            500
          );
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "LOAD_GUIDED_TOUR_STATUS_ERROR:",
          error
        );
      }
    }

    loadStatus();

    return () => {
      cancelled =
        true;

      if (openTimer) {
        window.clearTimeout(
          openTimer
        );
      }
    };
  }, [
    loadingUser,
    pathname,
    updateProgress,
    user?.id,
    user?.user_account_id,
  ]);

  /* =======================================================
   Manual Restart Event

   ใช้จาก Setup Center:
   window.dispatchEvent(
     new CustomEvent(
       "portal-guided-tour:restart"
     )
   )
======================================================= */

  useEffect(() => {
    function restartTour() {
      /*
      * กลับไป Step แรก
      */
      setCurrent(0);

      /*
      * บันทึกสถานะว่า
      * User เริ่ม Tour ใหม่อีกครั้ง
      */
      updateProgress({
        status:
          "started",

        currentStep:
          0,
      });

      /*
      * ถ้ามี Timer เก่าค้างอยู่
      * ให้ยกเลิกก่อน
      */
      if (
        openTimerRef.current
      ) {
        window.clearTimeout(
          openTimerRef.current
        );

        openTimerRef.current =
          null;
      }

      /*
      * รอ UI Render เล็กน้อย
      * แล้วเปิด Guided Tour
      */
      openTimerRef.current =
        window.setTimeout(
          () => {
            setOpen(true);

            openTimerRef.current =
              null;
          },
          150
        );
    }

    /*
    * ฟัง Event จาก Setup Center
    */
    window.addEventListener(
      "portal-guided-tour:restart",
      restartTour
    );

    /*
    * Cleanup
    */
    return () => {
      window.removeEventListener(
        "portal-guided-tour:restart",
        restartTour
      );

      if (
        openTimerRef.current
      ) {
        window.clearTimeout(
          openTimerRef.current
        );

        openTimerRef.current =
          null;
      }
    };
  }, [
    updateProgress,
  ]);

  /* =======================================================
     Cleanup Timer
  ======================================================= */

  useEffect(() => {
    return () => {
      if (
        openTimerRef.current
      ) {
        window.clearTimeout(
          openTimerRef.current
        );
      }
    };
  }, []);

  /* =======================================================
     Guard
  ======================================================= */

  if (
    !user ||
    !pathname?.startsWith(
      "/admin"
    )
  ) {
    return null;
  }

  /* =======================================================
     Render
  ======================================================= */

  return (
    <Tour
      open={open}

      current={
        Math.min(
          current,
          Math.max(
            steps.length -
              1,
            0
          )
        )
      }

      steps={steps}

      getPopupContainer={getTourPopupContainer}

      onChange={(
        next
      ) => {
        setCurrent(
          next
        );

        updateProgress({
          status:
            "started",

          currentStep:
            next,
        });
      }}

      onClose={() => {
        const isLastStep =
          current >=
          steps.length -
            1;

        if (
          isLastStep
        ) {
          handleFinish();
        } else {
          handleSkip();
        }
      }}

      mask

      arrow

      scrollIntoViewOptions={{
        behavior:
          "smooth",

        block:
          "center",
      }}
    />
  );
}
