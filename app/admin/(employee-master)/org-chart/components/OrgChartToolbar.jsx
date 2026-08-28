"use client";

import {
  Button,
  Flex,
  Segmented,
  Space,
  Typography,
} from "antd";

import {
  ApartmentOutlined,
  MinusOutlined,
  PlusOutlined,
  TableOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";

const {
  Text,
} = Typography;

export default function OrgChartToolbar({
  viewMode = "chart",
  zoom = 1,
  onViewModeChange,
  onZoomChange,
}) {
  const canZoom =
    viewMode === "chart";

  return (
    <Flex
      justify="space-between"
      align="center"
      wrap="wrap"
      gap={12}
    >
      <Segmented
        value={viewMode}
        onChange={
          onViewModeChange
        }
        options={[
          {
            value: "chart",
            label: "Org Chart",
            icon:
              <ApartmentOutlined />,
          },
          {
            value: "tree",
            label: "Tree",
            icon:
              <UnorderedListOutlined />,
          },
          {
            value: "table",
            label: "Table",
            icon:
              <TableOutlined />,
          },
        ]}
      />

      <Space>
        <Text
          type="secondary"
        >
          Zoom{" "}
          {Math.round(
            zoom * 100
          )}
          %
        </Text>

        <Button
          icon={
            <MinusOutlined />
          }
          disabled={
            !canZoom ||
            zoom <= 0.5
          }
          onClick={() =>
            onZoomChange?.(
              Math.max(
                0.5,
                Number(
                  (
                    zoom -
                    0.1
                  ).toFixed(1)
                )
              )
            )
          }
        />

        <Button
          disabled={
            !canZoom
          }
          onClick={() =>
            onZoomChange?.(
              1
            )
          }
        >
          100%
        </Button>

        <Button
          icon={
            <PlusOutlined />
          }
          disabled={
            !canZoom ||
            zoom >= 1.5
          }
          onClick={() =>
            onZoomChange?.(
              Math.min(
                1.5,
                Number(
                  (
                    zoom +
                    0.1
                  ).toFixed(1)
                )
              )
            )
          }
        />
      </Space>
    </Flex>
  );
}
