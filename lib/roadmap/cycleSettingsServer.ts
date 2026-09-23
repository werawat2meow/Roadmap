import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  defaultRoadmapCycleSettings,
  mapCycleSettingsFromApi,
  type RoadmapCycleSettings,
} from "@/lib/roadmap/cycleHelper";

export async function getRoadmapCycleSettings(): Promise<RoadmapCycleSettings> {
  const { data, error } = await supabaseAdmin
    .from("rm_cycle_settings")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Load roadmap cycle settings failed:", error);
    return defaultRoadmapCycleSettings;
  }

  return mapCycleSettingsFromApi(data);
}