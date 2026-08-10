"use client";

import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Row,
  Space,
} from "antd";

import {
  DeleteOutlined,
  HistoryOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

const { TextArea } = Input;

function toDayjs(value) {
  if (!value) {
    return null;
  }

  if (dayjs.isDayjs(value)) {
    return value;
  }

  const parsed = dayjs(value);

  return parsed.isValid()
    ? parsed
    : null;
}

export default function EmployeeWorkHistoryStep({
  disabled = false,
}) {
  return (
    <div>
      <Divider
        titlePlacement="left"
        plain
      >
        <Space>
          <HistoryOutlined />
          ประวัติการทำงานก่อนเข้าบริษัท
        </Space>
      </Divider>

      <Form.List name="work_histories">
        {(fields, { add, remove }) => (
          <>
            {fields.map(
              ({
                key,
                name,
                ...restField
              }) => (
                <Card
                  key={key}
                  size="small"
                  className="mb-4"
                  title={`ประวัติการทำงาน ${
                    name + 1
                  }`}
                  extra={
                    !disabled ? (
                      <Button
                        danger
                        type="text"
                        icon={
                          <DeleteOutlined />
                        }
                        onClick={() =>
                          remove(name)
                        }
                      >
                        ลบ
                      </Button>
                    ) : null
                  }
                >
                  <Row gutter={[16, 0]}>
                    <Col
                      xs={24}
                      md={12}
                    >
                      <Form.Item
                        {...restField}
                        label="ชื่อบริษัท"
                        name={[
                          name,
                          "company_name",
                        ]}
                        rules={[
                          {
                            required: true,
                            whitespace: true,
                            message:
                              "กรุณากรอกชื่อบริษัท",
                          },
                        ]}
                      >
                        <Input
                          disabled={
                            disabled
                          }
                          placeholder="ชื่อบริษัทเดิม"
                        />
                      </Form.Item>
                    </Col>

                    <Col
                      xs={24}
                      md={12}
                    >
                      <Form.Item
                        {...restField}
                        label="ตำแหน่ง"
                        name={[
                          name,
                          "position_name",
                        ]}
                        rules={[
                          {
                            required: true,
                            whitespace: true,
                            message:
                              "กรุณากรอกตำแหน่ง",
                          },
                        ]}
                      >
                        <Input
                          disabled={
                            disabled
                          }
                          placeholder="ตำแหน่งเดิม"
                        />
                      </Form.Item>
                    </Col>

                    <Col
                      xs={24}
                      md={8}
                    >
                      <Form.Item
                        {...restField}
                        label="วันที่เริ่มงาน"
                        name={[
                          name,
                          "start_date",
                        ]}
                        getValueProps={(
                          value
                        ) => ({
                          value:
                            toDayjs(
                              value
                            ),
                        })}
                        normalize={(
                          value
                        ) =>
                          toDayjs(
                            value
                          )
                        }
                      >
                        <DatePicker
                          disabled={
                            disabled
                          }
                          format="DD/MM/YYYY"
                          className="w-full"
                          placeholder="วันที่เริ่มงาน"
                        />
                      </Form.Item>
                    </Col>

                    <Col
                      xs={24}
                      md={8}
                    >
                      <Form.Item
                        {...restField}
                        label="วันที่สิ้นสุด"
                        name={[
                          name,
                          "end_date",
                        ]}
                        dependencies={[
                          [
                            "work_histories",
                            name,
                            "start_date",
                          ],
                        ]}
                        getValueProps={(
                          value
                        ) => ({
                          value:
                            toDayjs(
                              value
                            ),
                        })}
                        normalize={(
                          value
                        ) =>
                          toDayjs(
                            value
                          )
                        }
                        rules={[
                          ({
                            getFieldValue,
                          }) => ({
                            validator(
                              _,
                              value
                            ) {
                              const startDate =
                                getFieldValue(
                                  [
                                    "work_histories",
                                    name,
                                    "start_date",
                                  ]
                                );

                              if (
                                !value ||
                                !startDate
                              ) {
                                return Promise.resolve();
                              }

                              const end =
                                toDayjs(
                                  value
                                );

                              const start =
                                toDayjs(
                                  startDate
                                );

                              if (
                                end?.isBefore(
                                  start,
                                  "day"
                                )
                              ) {
                                return Promise.reject(
                                  new Error(
                                    "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มงาน"
                                  )
                                );
                              }

                              return Promise.resolve();
                            },
                          }),
                        ]}
                      >
                        <DatePicker
                          disabled={
                            disabled
                          }
                          format="DD/MM/YYYY"
                          className="w-full"
                          placeholder="วันที่สิ้นสุด"
                        />
                      </Form.Item>
                    </Col>

                    <Col
                      xs={24}
                      md={8}
                    >
                      <Form.Item
                        {...restField}
                        label="อายุงาน / รายละเอียด"
                        name={[
                          name,
                          "employment_duration",
                        ]}
                      >
                        <Input
                          disabled={
                            disabled
                          }
                          placeholder="เช่น 2 ปี 6 เดือน"
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24}>
                      <Form.Item
                        {...restField}
                        label="หน้าที่และความรับผิดชอบ"
                        name={[
                          name,
                          "responsibilities",
                        ]}
                      >
                        <TextArea
                          disabled={
                            disabled
                          }
                          rows={3}
                          placeholder="รายละเอียดงานที่รับผิดชอบ"
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24}>
                      <Form.Item
                        {...restField}
                        label="เหตุผลที่ออก"
                        name={[
                          name,
                          "reason_for_leaving",
                        ]}
                      >
                        <TextArea
                          disabled={
                            disabled
                          }
                          rows={2}
                          placeholder="เหตุผลที่ออกจากงาน"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              )
            )}

            {!disabled && (
              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={() =>
                  add({
                    company_name: "",
                    position_name: "",
                    start_date: null,
                    end_date: null,
                    employment_duration:
                      "",
                    responsibilities: "",
                    reason_for_leaving:
                      "",
                  })
                }
              >
                เพิ่มประวัติการทำงาน
              </Button>
            )}

            {fields.length === 0 &&
              disabled && (
                <Card size="small">
                  ยังไม่มีข้อมูลประวัติการทำงาน
                </Card>
              )}
          </>
        )}
      </Form.List>
    </div>
  );
}