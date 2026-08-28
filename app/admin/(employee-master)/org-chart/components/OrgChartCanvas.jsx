"use client";

import {
  Empty,
} from "antd";

import OrgChartNodeCard from "./OrgChartNodeCard";

import styles from "./OrgChartCanvas.module.css";

function Branch({
  node,
  ancestry = new Set(),
}) {
  const id =
    String(node.id);

  if (
    ancestry.has(id)
  ) {
    return null;
  }

  const next =
    new Set(
      ancestry
    );

  next.add(id);

  return (
    <li>
      <div
        className={
          styles.nodeWrap
        }
      >
        <OrgChartNodeCard
          node={node}
        />
      </div>

      {node.children
        ?.length >
        0 && (
        <ul>
          {node.children.map(
            (child) => (
              <Branch
                key={
                  child.id
                }
                node={child}
                ancestry={next}
              />
            )
          )}
        </ul>
      )}
    </li>
  );
}

export default function OrgChartCanvas({
  roots = [],
  zoom = 1,
}) {
  if (!roots.length) {
    return (
      <div
        className={
          styles.empty
        }
      >
        <Empty
          description="ไม่พบ Position Slot ตามตัวกรอง"
        />
      </div>
    );
  }

  return (
    <div
      className={
        styles.viewport
      }
    >
      <div
        className={
          styles.stage
        }
        style={{
          transform:
            `scale(${zoom})`,
        }}
      >
        <div
          className={
            styles.tree
          }
        >
          <ul>
            {roots.map(
              (root) => (
                <Branch
                  key={
                    root.id
                  }
                  node={root}
                />
              )
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
