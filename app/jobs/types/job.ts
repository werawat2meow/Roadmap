import { Translation } from "@/app/jobs/types/common";

export interface Job {
  id: string;
  companyId: string;
  companyName: Translation;
  positionTitle: Translation;
  position_name:string;
  job_name:Translation;
  branch_name:string;
  description: Translation;
  responsibilities: Translation[];
  qualifications: Translation[];
  benefits: Translation[];
  companyLogo: string;
  employmentType:
    | "full_time"
    | "part_time"
    | "contract"
    | "internship";
  experienceLevel:
    | "junior"
    | "mid"
    | "senior";
  workLocation: string;
  salary_note?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  status: "open" | "closed";
  urgent: boolean;
  opening_count: number | null;
  createdAt: string;
}