import { Translation } from "@/app/jobs/types/common";

export interface Job {
  id: string;

  companyId: string;

  companyName: Translation;

  positionTitle: Translation;

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

  salaryMin: number;
  salaryMax: number;

  status: "open" | "closed";

  createdAt: string;
}