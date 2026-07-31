"use client";

import {
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Tag,
} from "antd";

export default function CareerPathViewDrawer({
  open,
  onClose,

  data,
}) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Career Path Details"
      size="large"
      destroyOnHidden
    >
      {!data ? (
        <Empty description="No Data" />
      ) : (
        <>
          <Descriptions
            bordered
            column={1}
            size="small"
          >
            <Descriptions.Item label="Career Path Code">
              <strong>{data.path_code}</strong>
            </Descriptions.Item>

            <Descriptions.Item label="Career Path Name">
              {data.path_name}
            </Descriptions.Item>

            <Descriptions.Item label="Position Family">
              {data.position_families ? (
                <>
                  <strong>
                    {data.position_families.family_code}
                  </strong>
                  {" - "}
                  {data.position_families.family_name}
                </>
              ) : (
                "-"
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Description">
              {data.description || "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Sort Order">
              {data.sort_order}
            </Descriptions.Item>

            <Descriptions.Item label="Status">
              {data.is_active ? (
                <Tag color="green">
                  Active
                </Tag>
              ) : (
                <Tag color="red">
                  Inactive
                </Tag>
              )}
            </Descriptions.Item>

            <Descriptions.Item label="Created At">
              {data.created_at
                ? new Date(
                    data.created_at
                  ).toLocaleString("th-TH")
                : "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Updated At">
              {data.updated_at
                ? new Date(
                    data.updated_at
                  ).toLocaleString("th-TH")
                : "-"}
            </Descriptions.Item>
          </Descriptions>

          <Divider titlePlacement="left">
            Career Path Summary
          </Divider>

          <Descriptions
            bordered
            column={1}
            size="small"
          >
            <Descriptions.Item label="Path">
              {data.path_code} - {data.path_name}
            </Descriptions.Item>

            <Descriptions.Item label="Family">
              {data.position_families
                ?.family_name || "-"}
            </Descriptions.Item>

            <Descriptions.Item label="Status">
              {data.is_active
                ? "Active"
                : "Inactive"}
            </Descriptions.Item>
          </Descriptions>
        </>
      )}
    </Drawer>
  );
}