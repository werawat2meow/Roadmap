"use client";

import {
  Button,
  Form,
  InputNumber,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";

import {
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";

const {
  Text,
} = Typography;

export default function TaxRateBracketEditor({
  form,
  disabled = false,
}) {
  const calculationMethod =
    Form.useWatch(
      "calculation_method",
      form
    );

  function addBracket(
    add,
    fields
  ) {
    const current =
      form.getFieldValue(
        "brackets"
      ) || [];

    const previous =
      current[
        current.length - 1
      ];

    const nextMin =
      previous
        ?.income_max ??
      0;

    add({
      income_min:
        nextMin,

      income_max:
        null,

      tax_rate_percent:
        0,
    });
  }

  return (
    <Form.List
      name="brackets"
      rules={[
        {
          validator:
            async (
              _,
              rows
            ) => {
              if (
                !rows ||
                rows.length ===
                  0
              ) {
                throw new Error(
                  "กรุณาเพิ่มขั้นอัตราภาษีอย่างน้อย 1 ขั้น"
                );
              }
            },
        },
      ]}
    >
      {(
        fields,
        {
          add,
          remove,
        },
        {
          errors,
        }
      ) => {
        const columns = [
          {
            title: "ขั้น",
            width: 70,
            align: "center",
            render:
              (
                _,
                __,
                index
              ) => (
                <Tag>
                  {index +
                    1}
                </Tag>
              ),
          },
          {
            title:
              "รายได้เริ่มต้น",
            width: 190,
            render:
              (
                _,
                field
              ) => (
                <Form.Item
                  name={[
                    field.name,
                    "income_min",
                  ]}
                  style={{
                    margin: 0,
                  }}
                  rules={[
                    {
                      required:
                        true,
                      message:
                        "กรุณาระบุ",
                    },
                  ]}
                >
                  <InputNumber
                    disabled={
                      disabled
                    }
                    min={0}
                    precision={2}
                    style={{
                      width:
                        "100%",
                    }}
                    formatter={(
                      value
                    ) =>
                      value ===
                        null ||
                      value ===
                        undefined
                        ? ""
                        : String(
                            value
                          ).replace(
                            /\B(?=(\d{3})+(?!\d))/g,
                            ","
                          )
                    }
                    parser={(
                      value
                    ) =>
                      String(
                        value ||
                        ""
                      ).replace(
                        /,/g,
                        ""
                      )
                    }
                  />
                </Form.Item>
              ),
          },
          {
            title:
              "รายได้สิ้นสุด",
            width: 190,
            render:
              (
                _,
                field,
                index
              ) => (
                <Form.Item
                  name={[
                    field.name,
                    "income_max",
                  ]}
                  style={{
                    margin: 0,
                  }}
                  extra={
                    index ===
                    fields.length -
                      1
                      ? "เว้นว่าง = ไม่มีเพดาน"
                      : undefined
                  }
                >
                  <InputNumber
                    disabled={
                      disabled
                    }
                    min={0}
                    precision={2}
                    style={{
                      width:
                        "100%",
                    }}
                    formatter={(
                      value
                    ) =>
                      value ===
                        null ||
                      value ===
                        undefined
                        ? ""
                        : String(
                            value
                          ).replace(
                            /\B(?=(\d{3})+(?!\d))/g,
                            ","
                          )
                    }
                    parser={(
                      value
                    ) =>
                      String(
                        value ||
                        ""
                      ).replace(
                        /,/g,
                        ""
                      )
                    }
                  />
                </Form.Item>
              ),
          },
          {
            title:
              "อัตราภาษี (%)",
            width: 160,
            render:
              (
                _,
                field
              ) => (
                <Form.Item
                  name={[
                    field.name,
                    "tax_rate_percent",
                  ]}
                  style={{
                    margin: 0,
                  }}
                  rules={[
                    {
                      required:
                        true,
                      message:
                        "กรุณาระบุ",
                    },
                  ]}
                >
                  <InputNumber
                    disabled={
                      disabled
                    }
                    min={0}
                    max={100}
                    precision={4}
                    suffix="%"
                    style={{
                      width:
                        "100%",
                    }}
                  />
                </Form.Item>
              ),
          },
          {
            title: "",
            width: 70,
            align: "center",
            render:
              (
                _,
                field
              ) => (
                <Button
                  type="text"
                  danger
                  disabled={
                    disabled ||
                    (
                      calculationMethod ===
                        "flat" &&
                      fields.length <=
                        1
                    )
                  }
                  icon={
                    <DeleteOutlined />
                  }
                  onClick={() =>
                    remove(
                      field.name
                    )
                  }
                />
              ),
          },
        ];

        return (
          <Space
            orientation="vertical"
            size={12}
            style={{
              width: "100%",
            }}
          >
            <div>
              <Text strong>
                ขั้นอัตราภาษี
              </Text>

              <Text
                type="secondary"
                style={{
                  display:
                    "block",
                }}
              >
                Progressive สามารถมีหลายขั้น ส่วน Flat Rate ใช้ 1 ขั้น
              </Text>
            </div>

            <div
              style={{
                width: "100%",
                minWidth: 0,
                overflow:
                  "hidden",
              }}
            >
              <Table
                rowKey={(
                  field
                ) =>
                  field.key
                }
                columns={
                  columns
                }
                dataSource={
                  fields
                }
                pagination={
                  false
                }
                size="small"
                scroll={{
                  x: 760,
                }}
              />
            </div>

            {!disabled &&
              calculationMethod !==
                "flat" && (
                <Button
                  type="dashed"
                  block
                  icon={
                    <PlusOutlined />
                  }
                  onClick={() =>
                    addBracket(
                      add,
                      fields
                    )
                  }
                >
                  เพิ่มขั้นอัตราภาษี
                </Button>
              )}

            <Form.ErrorList
              errors={
                errors
              }
            />
          </Space>
        );
      }}
    </Form.List>
  );
}
