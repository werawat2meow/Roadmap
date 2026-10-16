import { Translation } from "@/app/jobs/types/common";

export type LocalizedText = Translation | Record<string, string>;

export interface Job {
  id: string;
  position_id?: string | null;
  branch_id?: string | null;
  branch_name?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  position_name?: string | null;
  position_level?: string | null;
  position_group?: string | null;
  job_description_id?: string | null;
  job_name?: LocalizedText | string | null;
  workplace?: string | null;
  salary_note?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  opening_count?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  urgent?: boolean | null;
  status?: boolean | "open" | "closed" | null;
  remark?: LocalizedText | null;
  requirements?: LocalizedText[] | null;
  responsibilities?: LocalizedText[] | null;
  qualifications?: LocalizedText[] | null;
  benefits?: LocalizedText[] | null;
  companyId?: string | null;
  companyName?: LocalizedText | null;
  positionTitle?: LocalizedText | string | null;
  description?: LocalizedText | null;
  companyLogo?: string | null;
  employmentType?:
    | "full_time"
    | "part_time"
    | "contract"
    | "internship"
    | null;
  experienceLevel?:
    | "junior"
    | "mid"
    | "senior"
    | null;
  createdAt?: string | null;
}
