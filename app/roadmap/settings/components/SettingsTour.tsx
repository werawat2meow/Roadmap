"use client";
import { useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export default function SettingsTour() {
  const driverRef = useRef<any>(null);

  useEffect(() => {
    // 1. เช็คใน Console ว่า Component เริ่มทำงานไหม
    console.log("Checking Settings Tour...");

    const hasSeenTour = localStorage.getItem("has_seen_settings_tour");
    console.log("Has seen tour before?:", hasSeenTour);

    if (hasSeenTour === "true") {
      console.log("Tour skipped: already seen.");
      return;
    }

    const driverObj = driver({
      showProgress: false,
      allowClose: false,
      overlayColor: "rgba(0, 0, 0, 0.8)",
      nextBtnText: "ต่อไป —>",
      prevBtnText: "<— ย้อนกลับ",
      doneBtnText: "เข้าใจแล้ว! เริ่มตั้งค่าเลย",
      popoverClass: 'roadmap-tour-popover',
      steps: [
        {
          element: "#settings-title",
          popover: {
            title: "ยินดีต้อนรับพนักงานทุกท่าน! 🛡️",
            description: "นี่คือหน้าสำหรับตั้งค่าเกณฑ์การประเมินทั้งหมดของระบบ Roadmap ครับ",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "#settings-tabs",
          popover: {
            title: "เลือกโหมดการตั้งค่า 🧭",
            description: "คุณสามารถสลับดูเกณฑ์ของบริษัท (Company) หรือรายแผนก (Department) ได้จากตรงนี้",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "#add-category-btn",
          popover: {
            title: "เพิ่มหมวดหมู่ใหม่! ➕",
            description: "กดปุ่มนี้เพื่อเพิ่มหมวดหมู่การประเมินใหม่ๆ เข้าสู่ระบบ",
            side: "left",
            align: "center",
          },
        },
      ],
      onDestroyed: () => {
        console.log("Tour closed/finished. Saving to localStorage.");
        localStorage.setItem("has_seen_settings_tour", "true");
      },
    });

    driverRef.current = driverObj;

    const timer = setTimeout(() => {
      const targetElement = document.querySelector("#settings-title");
      if (targetElement) {
        console.log("Target element found! Starting Tour...");
        driverObj.drive();
      } else {
        console.error("Target element #settings-title NOT FOUND! Please check ID in SettingsHeader.tsx");
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (driverRef.current) driverRef.current.destroy();
    };
  }, []);

  return null;
}