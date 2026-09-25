"use client";

import { useEffect, useState } from "react";
import {
  defaultRoadmapCycleSettings,
  mapCycleSettingsFromApi,
  type RoadmapCycleSettings,
} from "@/lib/roadmap/cycleHelper";

export function useRoadmapCycleSettings() {
  const [settings, setSettings] = useState<RoadmapCycleSettings>(
    defaultRoadmapCycleSettings
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const res = await fetch("/roadmap/api/settings/cycle", {
          cache: "no-store",
        });

        const json = await res.json();

        if (!mounted) return;

        if (res.ok) {
          setSettings(mapCycleSettingsFromApi(json.data));
        }
      } catch (error) {
        console.error("Load cycle settings failed:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  return { settings, loading };
}