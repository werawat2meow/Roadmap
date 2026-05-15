"use client";

import { Card, Row, Col } from "antd";
import BenefitMenuCard from "./BenefitMenuCard";

export default function BenefitMenuSection({ title, icon, menus, onNavigate }) {
  if (!menus?.length) return null;

  return (
    <Card
      variant="borderless"
      className="rounded-[24px] shadow-sm"
      title={
        <div className="flex items-center gap-2">
          <span className="text-emerald-600">{icon}</span>
          <span className="text-lg font-bold text-slate-800">{title}</span>
        </div>
      }
    >
      <Row gutter={[16, 16]}>
        {menus.map((item) => (
          <Col xs={24} md={12} xl={8} key={item.title}>
            <BenefitMenuCard item={item} onClick={() => onNavigate(item.path)} />
          </Col>
        ))}
      </Row>
    </Card>
  );
}