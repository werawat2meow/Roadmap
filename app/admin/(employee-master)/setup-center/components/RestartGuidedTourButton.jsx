"use client";

import {
  Button,
} from "antd";

import {
  CompassOutlined,
} from "@ant-design/icons";

export default function RestartGuidedTourButton() {
  async function handleRestart() {
    try {
      await fetch(
        "/api/admin/guided-tour",
        {
          method:
            "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              tour_code:
                "portal_intro",

              tour_version:
                1,

              status:
                "started",

              current_step:
                0,
            }),
        }
      );
    } catch (
      error
    ) {
      console.error(
        "RESTART_GUIDED_TOUR_ERROR:",
        error
      );
    }

    window.dispatchEvent(
      new CustomEvent(
        "portal-guided-tour:restart"
      )
    );
  }

  return (
    <Button
      icon={
        <CompassOutlined />
      }
      onClick={
        handleRestart
      }
    >
      แนะนำระบบอีกครั้ง
    </Button>
  );
}
