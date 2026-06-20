import { Card, Button } from "antd";

export default function JobDetailSidebar() {
  return (
    <Card className="sticky top-6">
      <h3 className="mb-4 text-lg font-semibold">
        Company Information
      </h3>

      <p>OpenTech</p>
      <p>Technology</p>
      <p>51-200 Employees</p>

      <Button
        type="primary"
        block
        className="mt-4"
      >
        Visit Website
      </Button>
    </Card>
  );
}