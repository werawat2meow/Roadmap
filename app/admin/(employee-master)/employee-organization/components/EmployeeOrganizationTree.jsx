"use client";

import { Empty, Tag, Tree, Typography } from "antd";

const { Text } = Typography;

function mapTreeData(nodes = []) {
  return nodes.map((node) => ({
    key: node.key,
    title: (
      <div className="flex items-center gap-2 py-1">
        <Text>{node.title || "-"}</Text>
        <Tag color="blue">{node.count || 0} คน</Tag>
      </div>
    ),
    raw: node,
    children: mapTreeData(node.children || []),
  }));
}

export default function EmployeeOrganizationTree({
  data = [],
  loading = false,
  onSelectNode,
}) {
  if (!loading && !data.length) {
    return <Empty description="ไม่พบโครงสร้างจากตัวกรองที่เลือก" />;
  }

  return (
    <Tree
      blockNode
      showLine
      defaultExpandAll={false}
      treeData={mapTreeData(data)}
      onSelect={(_, info) => {
        const node = info?.node?.raw;

        if (node?.type && node?.filters) {
          onSelectNode?.(node);
        }
      }}
    />
  );
}
