"use client";

import { Card, Col, Row } from "antd";

export default function MasterSummaryCards({
  items = [],
  gutter = [10, 10],
}) {
  return (
    <Row >
      {items.map((item, index) => (
        <Col
          key={index}
          xs={24}
          sm={12}
          md={8}
          lg={6}
        >
          <Card hoverable>
            <div className="flex items-center justify-between">

              <div>

                <div className="text-sm text-slate-500">
                  {item.title}
                </div>

                <div
                  className={`mt-2 text-3xl font-bold ${
                    item.className ??
                    "text-slate-800"
                  }`}
                >
                  {item.value}
                </div>

                {item.subtitle && (
                  <div className="mt-1 text-xs text-slate-400">
                    {item.subtitle}
                  </div>
                )}

              </div>

              {item.icon && (
                <div
                  className={`text-4xl ${
                    item.iconClassName ??
                    "text-slate-300"
                  }`}
                >
                  {item.icon}
                </div>
              )}

            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
}