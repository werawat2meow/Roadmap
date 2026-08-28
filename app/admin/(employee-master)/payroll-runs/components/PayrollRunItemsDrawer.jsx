"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Drawer,
  Flex,
  Input,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";

const {
  Text,
  Title,
} = Typography;

const STATUS_OPTIONS = [
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "calculated",
    label: "Calculated",
  },
  {
    value: "error",
    label: "Error",
  },
];

function money(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "-";
  }

  return new Intl.NumberFormat(
    "th-TH",
    {
      minimumFractionDigits:
        2,
      maximumFractionDigits:
        2,
    }
  ).format(
    Number(value || 0)
  );
}

async function readJson(
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

export default function PayrollRunItemsDrawer({
  open,
  run,
  onClose,
}) {
  const [
    rows,
    setRows,
  ] =
    useState([]);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    page,
    setPage,
  ] =
    useState(1);

  const [
    pageSize,
    setPageSize,
  ] =
    useState(20);

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
    status,
    setStatus,
  ] =
    useState();

  const loadItems =
    useCallback(
      async () => {
        if (
          !open ||
          !run?.id
        ) {
          return;
        }

        try {
          setLoading(true);

          const params =
            new URLSearchParams({
              page:
                String(page),
              pageSize:
                String(
                  pageSize
                ),
            });

          if (
            search.trim()
          ) {
            params.set(
              "search",
              search.trim()
            );
          }

          if (status) {
            params.set(
              "status",
              status
            );
          }

          const response =
            await fetch(
              `/api/admin/payroll-runs/${run.id}/items?${params.toString()}`,
              {
                cache:
                  "no-store",
              }
            );

          const json =
            await readJson(
              response
            );

          if (
            !response.ok ||
            !json.success
          ) {
            throw new Error(
              json.error ||
              "ไม่สามารถโหลดรายการพนักงานได้"
            );
          }

          setRows(
            Array.isArray(
              json.data
            )
              ? json.data
              : []
          );

          setTotal(
            json.pagination
              ?.total ||
            0
          );
        } catch (error) {
          console.error(
            "LOAD_PAYROLL_RUN_ITEMS_ERROR:",
            error
          );
        } finally {
          setLoading(false);
        }
      },
      [
        open,
        run?.id,
        page,
        pageSize,
        search,
        status,
      ]
    );

  useEffect(() => {
    loadItems();
  }, [
    loadItems,
  ]);

  useEffect(() => {
    if (!open) {
      setRows([]);
      setPage(1);
      setSearch("");
      setStatus(
        undefined
      );
    }
  }, [
    open,
  ]);

  const columns = [
    {
      title: "รหัสพนักงาน",
      dataIndex:
        "employee_code",
      width: 140,
      fixed: "left",
    },
    {
      title: "ชื่อพนักงาน",
      dataIndex:
        "employee_name",
      width: 230,
    },
    {
      title: "Base Salary",
      dataIndex:
        "base_salary",
      width: 140,
      align: "right",
      render:
        money,
    },
    {
      title: "Gross",
      dataIndex:
        "gross_amount",
      width: 140,
      align: "right",
      render:
        money,
    },
    {
      title: "Deduction",
      dataIndex:
        "deduction_amount",
      width: 140,
      align: "right",
      render:
        money,
    },
    {
      title: "Net",
      dataIndex:
        "net_amount",
      width: 140,
      align: "right",
      render:
        (value) => (
          <Text strong>
            {money(value)}
          </Text>
        ),
    },
    {
      title: "สถานะ",
      dataIndex:
        "calculation_status",
      width: 120,
      render:
        (value) => (
          <Tag
            color={
              value ===
              "calculated"
                ? "success"
                : value ===
                    "error"
                  ? "error"
                  : "default"
            }
          >
            {value}
          </Tag>
        ),
    },
    {
      title: "หมายเหตุคำนวณ",
      dataIndex:
        "calculation_note",
      width: 360,
      ellipsis: true,
      render:
        (value) =>
          value || "-",
    },
  ];

  return (
    <Drawer
      open={open}
      title={
        <Flex
          vertical
          gap={2}
        >
          <Title
            level={5}
            style={{
              margin: 0,
            }}
          >
            รายการพนักงานใน Payroll Run
          </Title>

          <Text
            type="secondary"
          >
            {run
              ? `${run.run_code} - ${run.run_name}`
              : "-"}
          </Text>
        </Flex>
      }
      size="large"
      onClose={
        onClose
      }
    >
      <Flex
        gap={10}
        wrap="wrap"
        style={{
          marginBottom: 14,
        }}
      >
        <Input.Search
          allowClear
          placeholder="ค้นหารหัส / ชื่อพนักงาน"
          style={{
            flex: "1 1 280px",
          }}
          onSearch={(
            value
          ) => {
            setPage(1);
            setSearch(
              value || ""
            );
          }}
        />

        <Select
          allowClear
          placeholder="ทุกสถานะ"
          options={
            STATUS_OPTIONS
          }
          style={{
            width: 160,
          }}
          onChange={(
            value
          ) => {
            setPage(1);
            setStatus(
              value
            );
          }}
        />
      </Flex>

      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={
            loading
          }
          scroll={{
            x: 1500,
          }}
          pagination={{
            current:
              page,
            pageSize,
            total,
            showSizeChanger:
              true,
            showTotal:
              (value) =>
                `ทั้งหมด ${value} รายการ`,
          }}
          onChange={(
            pagination
          ) => {
            setPage(
              pagination.current ||
              1
            );

            setPageSize(
              pagination.pageSize ||
              20
            );
          }}
        />
      </div>
    </Drawer>
  );
}
