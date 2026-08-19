"use client";

import {
  Alert,
  Col,
  Divider,
  Form,
  Row,
  Select,
  Space,
} from "antd";

import {
  ApartmentOutlined,
  BankOutlined,
  FundProjectionScreenOutlined,
  ProfileOutlined,
  SolutionOutlined,
} from "@ant-design/icons";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* =========================================================
   HELPERS
========================================================= */

function makeLabel(
  item,
  codeKey,
  nameKey
) {
  const code = item?.[codeKey];

  const name =
    item?.[nameKey] || "-";

  return code
    ? `${code} - ${name}`
    : name;
}

function isActive(item) {
  return (
    !item?.status ||
    item.status === "active"
  );
}

function normalizeRows(result) {
  if (Array.isArray(result?.data)) {
    return result.data;
  }

  if (Array.isArray(result?.items)) {
    return result.items;
  }

  if (Array.isArray(result)) {
    return result;
  }

  return [];
}

function normalizeFamilyOption(item) {
  if (!item?.id) {
    return null;
  }

  return {
    value: item.id,
    label: makeLabel(
      item,
      "family_code",
      "family_name"
    ),
  };
}

function mergeOptions(...groups) {
  const optionMap = new Map();

  groups
    .flat()
    .filter(Boolean)
    .forEach((option) => {
      if (!option?.value) {
        return;
      }

      optionMap.set(
        String(option.value),
        option
      );
    });

  return [...optionMap.values()];
}

/* =========================================================
   LAZY POSITION FAMILY SELECT

   Enterprise HRMS behavior:
   - โหลดครั้งละ 20 รายการ
   - Scroll ถึงท้าย Dropdown -> โหลดหน้าถัดไปครั้งละ 20
   - Search -> ค้นจาก API ทั้งฐานข้อมูล
   - Search ใหม่ -> reset page ทันที ป้องกันยิง page เก่าชนกัน
   - Abort request search เก่าที่ไม่ใช้แล้ว
   - ป้องกันยิงหน้าถัดไปซ้ำระหว่างกำลังโหลด
   - รองรับ Edit ที่ selected value ไม่อยู่ในหน้าแรก
========================================================= */

function LazyPositionFamilySelect({
  value,
  onChange,
  afterChange,
  disabled = false,
  initialOption = null,
}) {
  const PAGE_SIZE = 20;

  const [options, setOptions] =
    useState(() =>
      initialOption
        ? [initialOption]
        : []
    );

  const [loading, setLoading] =
    useState(false);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [page, setPage] =
    useState(0);

  const [hasMore, setHasMore] =
    useState(true);

  const [searchText, setSearchText] =
    useState("");

  const loadedOnceRef =
    useRef(false);

  const searchTimerRef =
    useRef(null);

  const requestControllerRef =
    useRef(null);

  const loadingMoreRef =
    useRef(false);

  const pageRef =
    useRef(0);

  const hasMoreRef =
    useRef(true);

  const searchTextRef =
    useRef("");

  const requestIdRef =
    useRef(0);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    searchTextRef.current = searchText;
  }, [searchText]);

  useEffect(() => {
    if (!initialOption) {
      return;
    }

    setOptions((current) =>
      mergeOptions(
        current,
        initialOption
      )
    );
  }, [initialOption]);

  const fetchPage = useCallback(
    async ({
      nextPage = 1,
      keyword = "",
      replace = false,
    } = {}) => {
      const cleanKeyword =
        String(keyword || "").trim();

      /* ---------------------------------------------------
         ป้องกัน Scroll ยิงหน้าถัดไปซ้ำ
      --------------------------------------------------- */

      if (
        !replace &&
        loadingMoreRef.current
      ) {
        return;
      }

      if (
        !replace &&
        !hasMoreRef.current
      ) {
        return;
      }

      /* ---------------------------------------------------
         Search / Replace ใหม่
         ยกเลิก request เก่าที่ยังไม่จบ
      --------------------------------------------------- */

      if (
        replace &&
        requestControllerRef.current
      ) {
        requestControllerRef.current.abort();
      }

      const controller =
        new AbortController();

      if (replace) {
        requestControllerRef.current =
          controller;

        setLoading(true);
      } else {
        loadingMoreRef.current = true;
        setLoadingMore(true);
      }

      const requestId =
        ++requestIdRef.current;

      try {
        const params =
          new URLSearchParams();

        params.set(
          "page",
          String(nextPage)
        );

        params.set(
          "pageSize",
          String(PAGE_SIZE)
        );

        params.set(
          "status",
          "active"
        );

        if (cleanKeyword) {
          params.set(
            "search",
            cleanKeyword
          );
        }

        const response = await fetch(
          `/api/admin/position-families?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ||
              result?.error ||
              "ไม่สามารถโหลดกลุ่มสายงานได้"
          );
        }

        /* -------------------------------------------------
           Search ใหม่ยิงแซง request เก่า
           ไม่เอาผลของ request เก่ามาทับ
        ------------------------------------------------- */

        if (
          replace &&
          requestId !==
            requestIdRef.current
        ) {
          return;
        }

        const rows =
          normalizeRows(result);

        const nextOptions = rows
          .filter(isActive)
          .map(normalizeFamilyOption)
          .filter(Boolean);

        const pagination =
          result?.pagination || {};

        const currentPage =
          Number(
            pagination.page
          ) || nextPage;

        const total = Number(
          pagination.total ??
            result?.total ??
            0
        );

        const totalPages =
          Number(
            pagination.totalPages
          ) ||
          (total > 0
            ? Math.ceil(
                total / PAGE_SIZE
              )
            : 0);

        const nextHasMore =
          typeof pagination.hasMore ===
          "boolean"
            ? pagination.hasMore
            : totalPages > 0
              ? currentPage < totalPages
              : rows.length === PAGE_SIZE;

        setOptions((current) => {
          const selectedOption =
            current.find(
              (option) =>
                String(
                  option.value
                ) ===
                String(value || "")
            ) || null;

          if (replace) {
            return mergeOptions(
              selectedOption,
              initialOption,
              nextOptions
            );
          }

          return mergeOptions(
            current,
            nextOptions
          );
        });

        setPage(currentPage);
        pageRef.current = currentPage;

        setHasMore(nextHasMore);
        hasMoreRef.current =
          nextHasMore;

        loadedOnceRef.current = true;
      } catch (error) {
        if (
          error?.name ===
          "AbortError"
        ) {
          return;
        }

        console.error(
          "LazyPositionFamilySelect load error:",
          error
        );
      } finally {
        if (replace) {
          if (
            requestControllerRef.current ===
            controller
          ) {
            requestControllerRef.current =
              null;
          }

          setLoading(false);
        } else {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        }
      }
    },
    [initialOption, value]
  );

  const fetchSelectedById =
    useCallback(
      async (selectedId) => {
        if (!selectedId) {
          return;
        }

        const alreadyLoaded =
          options.some(
            (option) =>
              String(option.value) ===
              String(selectedId)
          );

        if (alreadyLoaded) {
          return;
        }

        try {
          const params =
            new URLSearchParams();

          params.set(
            "id",
            String(selectedId)
          );

          params.set(
            "status",
            "active"
          );

          const response = await fetch(
            `/api/admin/position-families?${params.toString()}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

          const result =
            await response.json();

          if (!response.ok) {
            return;
          }

          const selectedOption =
            normalizeFamilyOption(
              normalizeRows(result)[0]
            );

          if (!selectedOption) {
            return;
          }

          setOptions((current) =>
            mergeOptions(
              current,
              selectedOption
            )
          );
        } catch (error) {
          console.error(
            "LazyPositionFamilySelect selected option error:",
            error
          );
        }
      },
      [options]
    );

  useEffect(() => {
    if (!value) {
      return;
    }

    fetchSelectedById(value);
  }, [
    value,
    fetchSelectedById,
  ]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(
          searchTimerRef.current
        );
      }

      if (
        requestControllerRef.current
      ) {
        requestControllerRef.current.abort();
      }
    };
  }, []);

  const handleDropdownOpenChange =
    (open) => {
      if (
        open &&
        !loadedOnceRef.current
      ) {
        fetchPage({
          nextPage: 1,
          keyword: "",
          replace: true,
        });
      }

      if (!open && searchTextRef.current) {
        if (searchTimerRef.current) {
          clearTimeout(
            searchTimerRef.current
          );
        }

        searchTextRef.current = "";
        setSearchText("");

        /* -----------------------------------------------
           ปิด Dropdown แล้ว Reset state
           ครั้งหน้าเปิด จะเห็นรายการปกติหน้าแรก
        ----------------------------------------------- */

        setPage(0);
        pageRef.current = 0;

        setHasMore(true);
        hasMoreRef.current = true;

        loadedOnceRef.current = false;
      }
    };

  const handleSearch = (value) => {
    const nextSearch =
      String(value || "");

    searchTextRef.current =
      nextSearch;

    setSearchText(
      nextSearch
    );

    /* ---------------------------------------------------
       สำคัญ:
       Reset pagination ทันที ไม่รอ debounce
       ป้องกัน Scroll ยิง page เก่าของ keyword ก่อนหน้า
    --------------------------------------------------- */

    setPage(0);
    pageRef.current = 0;

    setHasMore(true);
    hasMoreRef.current = true;

    if (searchTimerRef.current) {
      clearTimeout(
        searchTimerRef.current
      );
    }

    searchTimerRef.current =
      setTimeout(() => {
        fetchPage({
          nextPage: 1,
          keyword: nextSearch,
          replace: true,
        });
      }, 300);
  };

  const handlePopupScroll = (event) => {
    if (
      loading ||
      loadingMoreRef.current ||
      !hasMoreRef.current ||
      pageRef.current <= 0
    ) {
      return;
    }

    const target =
      event.currentTarget;

    const distanceToBottom =
      target.scrollHeight -
      target.scrollTop -
      target.clientHeight;

    if (distanceToBottom > 48) {
      return;
    }

    fetchPage({
      nextPage:
        pageRef.current + 1,
      keyword:
        searchTextRef.current,
      replace: false,
    });
  };

  const handleChange = (nextValue) => {
    onChange?.(nextValue);
    afterChange?.(nextValue);
  };

  return (
    <Select
      showSearch
      allowClear
      value={value}
      disabled={disabled}
      loading={loading}
      options={options}
      filterOption={false}
      searchValue={searchText}
      placeholder="เลือกกลุ่มสายงาน"
      onChange={handleChange}
      onSearch={handleSearch}
      onPopupScroll={
        handlePopupScroll
      }
      onOpenChange={
        handleDropdownOpenChange
      }
      notFoundContent={
        loading
          ? "กำลังโหลด..."
          : "ไม่พบกลุ่มสายงาน"
      }
      popupRender={(menu) => (
        <>
          {menu}
          {loadingMore ? (
            <div
              style={{
                padding: "8px 12px",
                textAlign: "center",
                color: "#64748b",
                fontSize: 12,
              }}
            >
              กำลังโหลดเพิ่มอีก 20 รายการ...
            </div>
          ) : null}
        </>
      )}
    />
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function EmployeeOrganizationStep({
  form,

  disabled = false,

  masterData = {},

  masterLoading = false,
}) {
  /* =======================================================
     WATCH FORM
  ======================================================= */

  const companyId =
    Form.useWatch(
      "company_id",
      form
    );

  const branchGroupId =
    Form.useWatch(
      "branch_group_id",
      form
    );

  const branchId =
    Form.useWatch(
      "branch_id",
      form
    );

  const departmentId =
    Form.useWatch(
      "department_id",
      form
    );

  const divisionId =
    Form.useWatch(
      "division_id",
      form
    );

  const unitId =
    Form.useWatch(
      "unit_id",
      form
    );

  const positionFamilyId =
    Form.useWatch(
      "position_family_id",
      form
    );

  const positionLevelId =
    Form.useWatch(
      "position_level_id",
      form
    );

  const positionId =
    Form.useWatch(
      "position_id",
      form
    );

  /* =======================================================
     MASTER DATA
  ======================================================= */

  const companies =
    masterData.companies || [];

  const branchGroups =
    masterData.branchGroups || [];

  const branches =
    masterData.branches || [];

  const departments =
    masterData.departments || [];

  const branchDepartments =
    masterData.branchDepartments || [];

  const divisions =
    masterData.divisions || [];

  const units =
    masterData.units || [];

  const positions =
    masterData.positions || [];

  const unitPositions =
    masterData.unitPositions || [];

  const jobs =
    masterData.jobs || [];

  const positionFamilies =
    masterData.positionFamilies || [];

  const positionFamilyInitialOption =
    useMemo(() => {
      if (!positionFamilyId) {
        return null;
      }

      const selected =
        positionFamilies.find(
          (item) =>
            String(item.id) ===
            String(positionFamilyId)
        );

      return selected
        ? normalizeFamilyOption(selected)
        : null;
    }, [
      positionFamilies,
      positionFamilyId,
    ]);

  const positionLevels =
    masterData.positionLevels || [];

  const positionFamilyLevels =
    masterData.positionFamilyLevels ||
    [];

  const businessUnits =
    masterData.businessUnits || [];

  const costCenters =
    masterData.costCenters || [];

  const profitCenters =
    masterData.profitCenters || [];

  /* =======================================================
     ORGANIZATION OPTIONS
  ======================================================= */

  const companyOptions =
    useMemo(
      () =>
        companies
          .filter(isActive)
          .map((item) => ({
            value: item.id,

            label: makeLabel(
              item,
              "company_code",
              "company_name_th"
            ),
          })),
      [companies]
    );

  const branchGroupOptions =
    useMemo(() => {
      const allowedGroupIds = new Set(
        branches
          .filter(
            (item) =>
              isActive(item) &&
              (!companyId ||
                item.company_id ===
                  companyId)
          )
          .map(
            (item) =>
              item.group_id ||
              item.branch_group_id
          )
          .filter(Boolean)
          .map(String)
      );

      return branchGroups
        .filter(
          (item) =>
            isActive(item) &&
            allowedGroupIds.has(
              String(item.id)
            )
        )
        .map((item) => ({
          value: item.id,

          label: makeLabel(
            item,
            "group_code",
            "group_name"
          ),
        }));
    }, [
      branchGroups,
      branches,
      companyId,
    ]);

  const branchOptions =
    useMemo(
      () =>
        branches
          .filter(
            (item) => {
              if (!isActive(item)) {
                return false;
              }

              if (
                companyId &&
                item.company_id !==
                  companyId
              ) {
                return false;
              }

              const itemGroupId =
                item.group_id ||
                item.branch_group_id;

              if (
                branchGroupId &&
                itemGroupId !==
                  branchGroupId
              ) {
                return false;
              }

              return true;
            }
          )
          .map((item) => ({
            value: item.id,

            label: makeLabel(
              item,
              "branch_code",
              "branch_name"
            ),
          })),
      [
        branches,
        companyId,
        branchGroupId,
      ]
    );

  const departmentOptions =
    useMemo(() => {
      const activeDepartments =
        departments.filter(
          isActive
        );

      if (!branchId) {
        return activeDepartments.map(
          (item) => ({
            value: item.id,

            label: makeLabel(
              item,
              "department_code",
              "department_name"
            ),
          })
        );
      }

      const allowedIds =
        new Set(
          branchDepartments
            .filter(
              (item) =>
                isActive(item) &&
                item.branch_id ===
                  branchId
            )
            .map(
              (item) =>
                item.department_id
            )
        );

      return activeDepartments
        .filter((item) =>
          allowedIds.has(item.id)
        )
        .map((item) => ({
          value: item.id,

          label: makeLabel(
            item,
            "department_code",
            "department_name"
          ),
        }));
    }, [
      branchId,
      branchDepartments,
      departments,
    ]);

  const divisionOptions =
    useMemo(
      () =>
        divisions
          .filter(
            (item) =>
              isActive(item) &&
              (!departmentId ||
                item.department_id ===
                  departmentId)
          )
          .map((item) => ({
            value: item.id,

            label: makeLabel(
              item,
              "division_code",
              "division_name"
            ),
          })),
      [
        divisions,
        departmentId,
      ]
    );

  const unitOptions =
    useMemo(
      () =>
        units
          .filter(
            (item) =>
              isActive(item) &&
              (!divisionId ||
                item.division_id ===
                  divisionId)
          )
          .map((item) => ({
            value: item.id,

            label: makeLabel(
              item,
              "unit_code",
              "unit_name"
            ),
          })),
      [
        units,
        divisionId,
      ]
    );

  /* =======================================================
     JOB ARCHITECTURE OPTIONS
  ======================================================= */



  /*
    Position Level ต้องกรองตาม
    position_family_levels
  */

  const positionLevelOptions =
    useMemo(() => {
      if (!positionFamilyId) {
        return [];
      }

      const mappings =
        positionFamilyLevels
          .filter(
            (item) =>
              item.position_family_id ===
              positionFamilyId
          )
          .sort(
            (a, b) =>
              Number(
                a.sort_order || 0
              ) -
              Number(
                b.sort_order || 0
              )
          );

      const levelIds =
        new Set(
          mappings.map(
            (item) =>
              item.position_level_id
          )
        );

      return positionLevels
        .filter(
          (item) =>
            isActive(item) &&
            levelIds.has(item.id)
        )
        .sort(
          (a, b) =>
            Number(
              a.sort_order || 0
            ) -
            Number(
              b.sort_order || 0
            )
        )
        .map((item) => ({
          value: item.id,

          label: makeLabel(
            item,
            "level_code",
            "level_name"
          ),
        }));
    }, [
      positionFamilyId,
      positionFamilyLevels,
      positionLevels,
    ]);

  /*
    ตำแหน่งกรองจาก:
    1. positions.position_family_id
    2. unit_positions เมื่อเลือกหน่วยงาน

    หมายเหตุ:
    ตาราง positions ปัจจุบันไม่มี
    position_level_id จึงยังไม่สามารถ
    กรอง Position ตาม Level โดยตรงได้
  */

  const positionOptions =
    useMemo(() => {
      let availablePositions =
        positions.filter(isActive);

      if (positionFamilyId) {
        availablePositions =
          availablePositions.filter(
            (item) =>
              item.position_family_id ===
              positionFamilyId
          );
      }

      if (unitId) {
        const allowedPositionIds =
          new Set(
            unitPositions
              .filter(
                (item) =>
                  isActive(item) &&
                  item.unit_id ===
                    unitId
              )
              .map(
                (item) =>
                  item.position_id
              )
          );

        availablePositions =
          availablePositions.filter(
            (item) =>
              allowedPositionIds.has(
                item.id
              )
          );
      }

      return availablePositions
        .sort(
          (a, b) =>
            Number(
              a.sort_order || 0
            ) -
            Number(
              b.sort_order || 0
            )
        )
        .map((item) => ({
          value: item.id,

          label: makeLabel(
            item,
            "position_code",
            "position_name"
          ),

          item,
        }));
    }, [
      positions,
      unitPositions,
      unitId,
      positionFamilyId,
    ]);

  const jobOptions =
    useMemo(
      () =>
        jobs
          .filter(isActive)
          .map((item) => ({
            value: item.id,

            label: makeLabel(
              item,
              "job_code",
              "job_name"
            ),
          })),
      [jobs]
    );

  /* =======================================================
     COST STRUCTURE OPTIONS
  ======================================================= */

  const businessUnitOptions =
    useMemo(
      () =>
        businessUnits
          .filter(isActive)
          .map((item) => ({
            value: item.id,

            label: makeLabel(
              item,
              "business_unit_code",
              "business_unit_name"
            ),
          })),
      [businessUnits]
    );

  const costCenterOptions =
    useMemo(
      () =>
        costCenters
          .filter(isActive)
          .map((item) => ({
            value: item.id,

            label: makeLabel(
              item,
              "cost_center_code",
              "cost_center_name"
            ),
          })),
      [costCenters]
    );

  const profitCenterOptions =
    useMemo(
      () =>
        profitCenters
          .filter(isActive)
          .map((item) => ({
            value: item.id,

            label: makeLabel(
              item,
              "profit_center_code",
              "profit_center_name"
            ),
          })),
      [profitCenters]
    );

  /* =======================================================
     DATA CONSISTENCY EFFECTS
  ======================================================= */

  /*
    ถ้าเปลี่ยนบริษัทแล้ว Branch เดิม
    ไม่ได้อยู่ในบริษัทนั้น ให้ Reset
  */

  useEffect(() => {
    if (!branchId) {
      return;
    }

    const selectedBranch =
      branches.find(
        (item) =>
          item.id === branchId
      );

    if (
      selectedBranch &&
      companyId &&
      selectedBranch.company_id !==
        companyId
    ) {
      form.setFieldsValue({
        branch_id: undefined,

        department_id:
          undefined,

        division_id:
          undefined,

        unit_id: undefined,

        position_id:
          undefined,

        job_id: undefined,
      });
    }
  }, [
    companyId,
    branchId,
    branches,
    form,
  ]);

  /*
    เมื่อเลือก Position:
    1. ดึง position_family_id
    2. ดึง job_id
    จากข้อมูล Position เป็นค่าเริ่มต้น
  */

  useEffect(() => {
    if (!positionId) {
      return;
    }

    const selectedPosition =
      positions.find(
        (item) =>
          item.id === positionId
      );

    if (!selectedPosition) {
      return;
    }

    const nextValues = {};

    if (
      selectedPosition
        .position_family_id &&
      selectedPosition
        .position_family_id !==
        positionFamilyId
    ) {
      nextValues.position_family_id =
        selectedPosition.position_family_id;
    }

    if (selectedPosition.job_id) {
      nextValues.job_id =
        selectedPosition.job_id;
    }

    if (
      Object.keys(nextValues)
        .length > 0
    ) {
      form.setFieldsValue(
        nextValues
      );
    }
  }, [
    positionId,
    positionFamilyId,
    positions,
    form,
  ]);

  /*
    ถ้า Family เปลี่ยนแล้ว Level เดิม
    ไม่อยู่ใน Family ใหม่ ให้ Reset
  */

  useEffect(() => {
    if (
      !positionFamilyId ||
      !positionLevelId
    ) {
      return;
    }

    const levelIsAllowed =
      positionFamilyLevels.some(
        (item) =>
          item.position_family_id ===
            positionFamilyId &&
          item.position_level_id ===
            positionLevelId
      );

    if (!levelIsAllowed) {
      form.setFieldValue(
        "position_level_id",
        undefined
      );
    }
  }, [
    positionFamilyId,
    positionLevelId,
    positionFamilyLevels,
    form,
  ]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div>
      <Alert
        showIcon
        type="info"
        title="โครงสร้างองค์กรและสายอาชีพ"
        description="เลือกตามลำดับ บริษัท → กรุ๊ปสังกัด → สังกัด → แผนก → ฝ่าย → หน่วยงาน → กลุ่มสายงาน → ระดับตำแหน่ง → ตำแหน่ง → บทบาทงาน"
        className="mb-5"
      />

      {/* ===================================================
          COMPANY AND BRANCH
      =================================================== */}

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <BankOutlined />
          บริษัทและสังกัด
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="บริษัท"
            name="company_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกบริษัท",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={disabled}
              options={
                companyOptions
              }
              optionFilterProp="label"
              placeholder="เลือกบริษัท"
              onChange={() => {
                form.setFieldsValue({
                  branch_group_id:
                    undefined,

                  branch_id:
                    undefined,

                  department_id:
                    undefined,

                  division_id:
                    undefined,

                  unit_id:
                    undefined,

                  position_id:
                    undefined,

                  job_id:
                    undefined,
                });
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="กรุ๊ปสังกัด"
            name="branch_group_id"
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={disabled}
              options={
                branchGroupOptions
              }
              optionFilterProp="label"
              placeholder="เลือกกรุ๊ปสังกัด"
              onChange={() => {
                form.setFieldsValue({
                  branch_id:
                    undefined,
                  department_id:
                    undefined,
                  division_id:
                    undefined,
                  unit_id:
                    undefined,
                  position_id:
                    undefined,
                  job_id:
                    undefined,
                });
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="สังกัด"
            name="branch_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกสังกัด",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={
                disabled ||
                !companyId
              }
              options={
                branchOptions
              }
              optionFilterProp="label"
              placeholder={
                companyId
                  ? "เลือกสังกัด"
                  : "กรุณาเลือกบริษัทก่อน"
              }
              onChange={() => {
                form.setFieldsValue({
                  department_id:
                    undefined,

                  division_id:
                    undefined,

                  unit_id:
                    undefined,

                  position_id:
                    undefined,

                  job_id:
                    undefined,
                });
              }}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* ===================================================
          ORGANIZATION UNIT
      =================================================== */}

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <ApartmentOutlined />
          หน่วยงาน
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="แผนก"
            name="department_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกแผนก",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={
                disabled ||
                !branchId
              }
              options={
                departmentOptions
              }
              optionFilterProp="label"
              placeholder={
                branchId
                  ? "เลือกแผนก"
                  : "กรุณาเลือกสังกัดก่อน"
              }
              onChange={() => {
                form.setFieldsValue({
                  division_id:
                    undefined,

                  unit_id:
                    undefined,

                  position_id:
                    undefined,

                  job_id:
                    undefined,
                });
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="ฝ่าย"
            name="division_id"
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={
                disabled ||
                !departmentId
              }
              options={
                divisionOptions
              }
              optionFilterProp="label"
              placeholder={
                departmentId
                  ? "เลือกฝ่าย"
                  : "กรุณาเลือกแผนกก่อน"
              }
              onChange={() => {
                form.setFieldsValue({
                  unit_id:
                    undefined,

                  position_id:
                    undefined,

                  job_id:
                    undefined,
                });
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="หน่วยงาน"
            name="unit_id"
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={
                disabled ||
                !divisionId
              }
              options={unitOptions}
              optionFilterProp="label"
              placeholder={
                divisionId
                  ? "เลือกหน่วยงาน"
                  : "กรุณาเลือกฝ่ายก่อน"
              }
              onChange={() => {
                form.setFieldsValue({
                  position_id:
                    undefined,

                  job_id:
                    undefined,
                });
              }}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* ===================================================
          JOB ARCHITECTURE
      =================================================== */}

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <ProfileOutlined />
          กลุ่มสายงานและระดับตำแหน่ง
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="กลุ่มสายงาน"
            name="position_family_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกกลุ่มสายงาน",
              },
            ]}
          >
            <LazyPositionFamilySelect
              disabled={disabled}
              initialOption={
                positionFamilyInitialOption
              }
              afterChange={() => {
                form.setFieldsValue({
                  position_level_id:
                    undefined,

                  position_id:
                    undefined,

                  job_id:
                    undefined,
                });
              }}
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="ระดับตำแหน่ง"
            name="position_level_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกระดับตำแหน่ง",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={
                disabled ||
                !positionFamilyId
              }
              options={
                positionLevelOptions
              }
              optionFilterProp="label"
              placeholder={
                positionFamilyId
                  ? "เลือกระดับตำแหน่ง"
                  : "กรุณาเลือกกลุ่มสายงานก่อน"
              }
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="ตำแหน่ง"
            name="position_id"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกตำแหน่ง",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={
                disabled ||
                !positionFamilyId ||
                !positionLevelId
              }
              options={
                positionOptions
              }
              optionFilterProp="label"
              placeholder={
                !positionFamilyId
                  ? "กรุณาเลือกกลุ่มสายงานก่อน"
                  : !positionLevelId
                    ? "กรุณาเลือกระดับตำแหน่งก่อน"
                    : "เลือกตำแหน่ง"
              }
              onChange={(
                value
              ) => {
                const selectedPosition =
                  positions.find(
                    (item) =>
                      item.id === value
                  );

                form.setFieldValue(
                  "job_id",
                  selectedPosition
                    ?.job_id ||
                    undefined
                );
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="บทบาทงาน / Job"
            name="job_id"
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={disabled}
              options={jobOptions}
              optionFilterProp="label"
              placeholder="เลือกบทบาทงาน"
            />
          </Form.Item>
        </Col>
      </Row>

      {/* ===================================================
          COST STRUCTURE
      =================================================== */}

      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <FundProjectionScreenOutlined />
          โครงสร้างต้นทุน
        </Space>
      </Divider>

      <Row gutter={[16, 0]}>
        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="Business Unit"
            name="business_unit_id"
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={disabled}
              options={
                businessUnitOptions
              }
              optionFilterProp="label"
              placeholder="เลือก Business Unit"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="Cost Center"
            name="cost_center_id"
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={disabled}
              options={
                costCenterOptions
              }
              optionFilterProp="label"
              placeholder="เลือก Cost Center"
            />
          </Form.Item>
        </Col>

        <Col
          xs={24}
          md={8}
        >
          <Form.Item
            label="Profit Center"
            name="profit_center_id"
          >
            <Select
              showSearch
              allowClear
              loading={masterLoading}
              disabled={disabled}
              options={
                profitCenterOptions
              }
              optionFilterProp="label"
              placeholder="เลือก Profit Center"
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}