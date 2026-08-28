"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
} from "antd";

import {
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import EmployeeBankAccountEmployeeSelect from "./EmployeeBankAccountEmployeeSelect";

function getBankLabel(
  bank
) {
  const code =
    bank?.bank_code ||
    bank?.code ||
    "";

  const name =
    bank?.bank_name_th ||
    bank?.bank_name ||
    bank?.bank_name_en ||
    bank?.name ||
    "-";

  return code
    ? `${code} - ${name}`
    : name;
}

export default function EmployeeBankAccountSearch({
  loading = false,

  search = "",

  employeeId,
  bankId,
  status,
  isPrimary,

  banks = [],

  onSearch,
  onEmployeeChange,
  onBankChange,
  onStatusChange,
  onPrimaryChange,

  onReset,
  onRefresh,
}) {
  const [
    keyword,
    setKeyword,
  ] = useState(
    search || ""
  );

  /* =========================================================
     Sync Parent -> Local
  ========================================================= */

  useEffect(() => {
    setKeyword(
      search || ""
    );
  }, [
    search,
  ]);

  /* =========================================================
     Auto Search + Debounce

     หยุดพิมพ์ 350ms
     แล้วค่อยยิง API
  ========================================================= */

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          const value =
            keyword.trim();

          /*
           * ป้องกันยิงซ้ำ
           * ถ้าค่าที่ Parent ใช้อยู่
           * เท่ากับค่าปัจจุบันแล้ว
           */
          if (
            value ===
            String(
              search || ""
            ).trim()
          ) {
            return;
          }

          onSearch?.(
            value
          );
        },
        350
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    keyword,
    search,
    onSearch,
  ]);

  /* =========================================================
     Reset
  ========================================================= */

  const handleReset =
    () => {
      setKeyword("");

      onReset?.();
    };

  return (
    <Card size="small">
      <Row
        gutter={[
          12,
          12,
        ]}
        align="middle"
      >
        {/* Search */}

        <Col
          xs={24}
          md={12}
          xl={6}
        >
          <Input.Search
            allowClear

            value={
              keyword
            }

            placeholder="ค้นหาเลขบัญชี / ชื่อบัญชี / สาขา"

            enterButton={
              <SearchOutlined />
            }

            onChange={(
              event
            ) => {
              setKeyword(
                event.target.value
              );
            }}

            /*
             * กด Enter / กดปุ่ม Search
             * ให้ค้นหาทันที ไม่ต้องรอ 350ms
             */
            onSearch={(
              value
            ) => {
              onSearch?.(
                String(
                  value || ""
                ).trim()
              );
            }}
          />
        </Col>

        {/* Employee Lazy Search */}

        <Col
          xs={24}
          md={12}
          xl={6}
        >
          <EmployeeBankAccountEmployeeSelect
            value={
              employeeId
            }

            onChange={
              onEmployeeChange
            }

            placeholder="กรองตามพนักงาน"
          />
        </Col>

        {/* Bank */}

        <Col
          xs={24}
          md={8}
          xl={4}
        >
          <Select
            allowClear
            showSearch

            value={
              bankId
            }

            placeholder="ธนาคาร"

            optionFilterProp="label"

            className="w-full"

            options={
              banks.map(
                (item) => ({
                  value:
                    item.id,

                  label:
                    getBankLabel(
                      item
                    ),
                })
              )
            }

            onChange={
              onBankChange
            }
          />
        </Col>

        {/* Status */}

        <Col
          xs={12}
          md={8}
          xl={3}
        >
          <Select
            allowClear

            value={
              status
            }

            placeholder="สถานะ"

            className="w-full"

            options={[
              {
                value:
                  "active",

                label:
                  "ใช้งาน",
              },
              {
                value:
                  "inactive",

                label:
                  "ไม่ใช้งาน",
              },
            ]}

            onChange={
              onStatusChange
            }
          />
        </Col>

        {/* Primary */}

        <Col
          xs={12}
          md={8}
          xl={3}
        >
          <Select
            allowClear

            value={
              isPrimary
            }

            placeholder="ประเภทบัญชี"

            className="w-full"

            options={[
              {
                value: true,

                label:
                  "บัญชีหลัก",
              },
              {
                value: false,

                label:
                  "บัญชีรอง",
              },
            ]}

            onChange={
              onPrimaryChange
            }
          />
        </Col>

        {/* Action */}

        <Col
          xs={24}
          xl={2}
        >
          <Space
            className="w-full justify-end"
          >
            <Button
              onClick={
                handleReset
              }
            >
              ล้าง
            </Button>

            <Button
              icon={
                <ReloadOutlined />
              }

              loading={
                loading
              }

              onClick={
                onRefresh
              }
            />
          </Space>
        </Col>
      </Row>
    </Card>
  );
}