"use client";

import {
  Flex,
  Tag,
  Tree,
  Typography,
} from "antd";

import {
  ApartmentOutlined,
  UserOutlined,
} from "@ant-design/icons";

const {
  Text,
} = Typography;

function toTreeData(
  nodes = []
) {
  return nodes.map(
    (node) => ({
      key:
        String(node.id),

      title: (
        <Flex
          gap={8}
          align="center"
          wrap="wrap"
        >
          <ApartmentOutlined />

          <Text strong>
            {node.slot_code
              ? `${node.slot_code} - `
              : ""}
            {node.position_name ||
              node.slot_name}
          </Text>

          {node.position_level_code && (
            <Tag>
              {
                node.position_level_code
              }
            </Tag>
          )}

          <Tag
            icon={
              <UserOutlined />
            }
            color={
              node.filled > 0
                ? "success"
                : "warning"
            }
          >
            {node.filled}/
            {node.capacity}
          </Tag>

          {node.occupants
            ?.length >
            0 && (
            <Text
              type="secondary"
            >
              {node.occupants
                .map(
                  (item) =>
                    `${item.employee_code} ${item.full_name}`
                )
                .join(", ")}
            </Text>
          )}
        </Flex>
      ),

      children:
        toTreeData(
          node.children ||
          []
        ),
    })
  );
}

export default function OrgChartTreeView({
  roots = [],
}) {
  return (
    <Tree
      showLine
      defaultExpandAll
      treeData={
        toTreeData(
          roots
        )
      }
    />
  );
}
