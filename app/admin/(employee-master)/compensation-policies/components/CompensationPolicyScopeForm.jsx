"use client";

import {BuildingOffice2Icon,} from "@heroicons/react/24/outline";
import {FormSection,} from "./shared";

export default function CompensationPolicyScopeForm({
    form = {},
    companies = [],
    branches = [],
    departments = [],
    divisions = [],
    units = [],
    positions = [],
    onChange,
}) {

    const handleChange = (field, value) => {
      if (typeof onChange === "function") {
        onChange((prev) => ({
          ...prev,
          [field]: value,
        }));
      }

    };

    return (
        <div className="space-y-8">

          {/* Organization */}
          <FormSection
            title="Organization Scope"
            description="กำหนดว่า Policy นี้ใช้กับหน่วยงานใด"
            icon={
                <BuildingOffice2Icon className="h-6 w-6" />
            }
            iconClassName="bg-indigo-600"
          >

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                  {/* Company */}
                  <div>

                      <label className="mb-2 block text-sm font-semibold">

                          Company

                      </label>

                      <select

                          value={form.company_id || ""}

                          onChange={(e)=>

                              handleChange(

                                  "company_id",

                                  e.target.value

                              )

                          }

                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"

                      >

                          <option value="">

                              All Companies

                          </option>

                          {companies.map(company=>(

                              <option

                                  key={company.id}

                                  value={company.id}

                              >

                                  {company.company_name_th}

                              </option>

                          ))}

                      </select>

                  </div>

                  {/* Branch */}

                  <div>

                      <label className="mb-2 block text-sm font-semibold">

                          Branch

                      </label>

                      <select

                          value={form.branch_id || ""}

                          onChange={(e)=>

                              handleChange(

                                  "branch_id",

                                  e.target.value

                              )

                          }

                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"

                      >

                          <option value="">

                              All Branches

                          </option>

                          {branches.map(branch=>(

                              <option

                                  key={branch.id}

                                  value={branch.id}

                              >

                                  {branch.branch_name}

                              </option>

                          ))}

                      </select>

                  </div>

                  {/* Department */}

                  <div>

                      <label className="mb-2 block text-sm font-semibold">

                          Department

                      </label>

                      <select

                          value={form.department_id || ""}

                          onChange={(e)=>

                              handleChange(

                                  "department_id",

                                  e.target.value

                              )

                          }

                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"

                      >

                          <option value="">

                              All Departments

                          </option>

                          {departments.map(item=>(

                              <option

                                  key={item.id}

                                  value={item.id}

                              >

                                  {item.department_name}

                              </option>

                          ))}

                      </select>

                  </div>

                  {/* Division */}

                  <div>

                      <label className="mb-2 block text-sm font-semibold">

                          Division

                      </label>

                      <select

                          value={form.division_id || ""}

                          onChange={(e)=>

                              handleChange(

                                  "division_id",

                                  e.target.value

                              )

                          }

                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"

                      >

                          <option value="">

                              All Divisions

                          </option>

                          {divisions.map(item=>(

                              <option

                                  key={item.id}

                                  value={item.id}

                              >

                                  {item.division_name}

                              </option>

                          ))}

                      </select>

                  </div>

                  {/* Unit */}

                  <div>

                      <label className="mb-2 block text-sm font-semibold">

                          Unit

                      </label>

                      <select

                          value={form.unit_id || ""}

                          onChange={(e)=>

                              handleChange(

                                  "unit_id",

                                  e.target.value

                              )

                          }

                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"

                      >

                          <option value="">

                              All Units

                          </option>

                          {units.map(item=>(

                              <option

                                  key={item.id}

                                  value={item.id}

                              >

                                  {item.unit_name}

                              </option>

                          ))}

                      </select>

                  </div>

                  {/* Position */}

                  <div>

                      <label className="mb-2 block text-sm font-semibold">

                          Position

                      </label>

                      <select

                          value={form.position_id || ""}

                          onChange={(e)=>

                              handleChange(

                                  "position_id",

                                  e.target.value

                              )

                          }

                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"

                      >

                          <option value="">

                              All Positions

                          </option>

                          {positions.map(item=>(
                            <option
                              key={item.id}
                              value={item.id}
                            >
                              {item.position_name}
                            </option>
                          ))}
                      </select>
                  </div>


                {/* ========================================== */}
                {/* Employee Filters */}
                {/* ========================================== */}

                <div className="lg:col-span-2">

                    <div className="my-2 border-t border-slate-200 pt-6">

                        <h4 className="text-base font-bold text-slate-800">
                            Employee Filters
                        </h4>

                        <p className="mt-1 text-sm text-slate-500">
                            จำกัดพนักงานที่สามารถใช้งาน Policy นี้
                        </p>

                    </div>

                </div>

                {/* Employment Type */}

                <div>

                    <label className="mb-2 block text-sm font-semibold">
                        Employment Type
                    </label>

                    <select
                        value={form.employment_type || ""}
                        onChange={(e)=>
                            handleChange(
                                "employment_type",
                                e.target.value
                            )
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    >

                        <option value="">
                            All Employment Types
                        </option>

                        <option value="permanent">
                            Permanent
                        </option>

                        <option value="probation">
                            Probation
                        </option>

                        <option value="contract">
                            Contract
                        </option>

                        <option value="temporary">
                            Temporary
                        </option>

                        <option value="intern">
                            Intern
                        </option>

                    </select>

                </div>

                {/* Employee Status */}

                <div>

                    <label className="mb-2 block text-sm font-semibold">
                        Employee Status
                    </label>

                    <select
                        value={form.employee_status || ""}
                        onChange={(e)=>
                            handleChange(
                                "employee_status",
                                e.target.value
                            )
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    >

                        <option value="">
                            All Status
                        </option>

                        <option value="active">
                            Active
                        </option>

                        <option value="leave">
                            Leave
                        </option>

                        <option value="suspend">
                            Suspend
                        </option>

                    </select>

                </div>

                {/* Employee Type */}

                <div>

                    <label className="mb-2 block text-sm font-semibold">
                        Employee Type
                    </label>

                    <select
                        value={form.employee_type || ""}
                        onChange={(e)=>
                            handleChange(
                                "employee_type",
                                e.target.value
                            )
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    >

                        <option value="">
                            All Employee Types
                        </option>

                        <option value="thai">
                            Thai
                        </option>

                        <option value="foreign">
                            Foreign
                        </option>

                        <option value="student">
                            Student
                        </option>

                        <option value="myanmar">
                            Myanmar
                        </option>

                    </select>

                </div>

                {/* Nationality */}

                <div>

                    <label className="mb-2 block text-sm font-semibold">
                        Nationality
                    </label>

                    <input
                        type="text"
                        value={form.nationality || ""}
                        placeholder="TH, MM, JP ..."
                        onChange={(e)=>
                            handleChange(
                                "nationality",
                                e.target.value
                            )
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    />

                </div>

                {/* Gender */}

                <div>

                    <label className="mb-2 block text-sm font-semibold">
                        Gender
                    </label>

                    <select
                        value={form.gender || ""}
                        onChange={(e)=>
                            handleChange(
                                "gender",
                                e.target.value
                            )
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    >

                        <option value="">
                            All Gender
                        </option>

                        <option value="male">
                            Male
                        </option>

                        <option value="female">
                            Female
                        </option>

                        <option value="other">
                            Other
                        </option>

                    </select>

                </div>

                {/* Religion */}

                <div>

                    <label className="mb-2 block text-sm font-semibold">
                        Religion
                    </label>

                    <input
                        type="text"
                        value={form.religion || ""}
                        placeholder="Optional"
                        onChange={(e)=>
                            handleChange(
                                "religion",
                                e.target.value
                            )
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    />

                </div>

                {/* ========================================== */}
                {/* Job & Position Filters */}
                {/* ========================================== */}

                <div className="lg:col-span-2">

                    <div className="my-2 border-t border-slate-200 pt-6">

                        <h4 className="text-base font-bold text-slate-800">
                            Job & Position Filters
                        </h4>

                        <p className="mt-1 text-sm text-slate-500">
                            กำหนดตำแหน่งงานและโครงสร้างที่สามารถใช้งาน Policy นี้
                        </p>

                    </div>

                </div>

                {/* Position Group */}

                <div>

                    <label className="mb-2 block text-sm font-semibold">
                        Position Group
                    </label>

                    <select
                        value={form.position_group || ""}
                        onChange={(e)=>
                            handleChange(
                                "position_group",
                                e.target.value
                            )
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    >

                        <option value="">
                            All Position Groups
                        </option>

                        {[
                            "P1","P2","P3","P4",
                            "P5","P6","P7","P8",
                            "P9","P10","P11","P12"
                        ].map(level=>(

                            <option
                                key={level}
                                value={level}
                            >
                                {level}
                            </option>

                        ))}

                    </select>

                </div>

                {/* Position Level */}

                <div>

                    <label className="mb-2 block text-sm font-semibold">
                        Position Level
                    </label>

                    <input
                        type="number"
                        min="1"
                        max="12"
                        value={form.position_level || ""}
                        placeholder="1-12"
                        onChange={(e)=>
                            handleChange(
                                "position_level",
                                e.target.value
                            )
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    />

                </div>

                {/* Position Family */}

                <div>

                    <label className="mb-2 block text-sm font-semibold">
                        Position Family
                    </label>

                    <select
                        value={form.position_family_id || ""}
                        onChange={(e)=>
                            handleChange(
                                "position_family_id",
                                e.target.value
                            )
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    >

                        <option value="">
                            All Position Families
                        </option>

                        {(positionFamilies || []).map(item=>(

                            <option
                                key={item.id}
                                value={item.id}
                            >
                                {item.family_name}
                            </option>

                        ))}

                    </select>

                </div>

                {/* Salary Grade */}

                <div>

                    <label className="mb-2 block text-sm font-semibold">
                        Salary Grade
                    </label>

                    <select
                        value={form.salary_grade_id || ""}
                        onChange={(e)=>
                            handleChange(
                                "salary_grade_id",
                                e.target.value
                            )
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    >

                        <option value="">
                            All Salary Grades
                        </option>

                        {(salaryGrades || []).map(item=>(

                            <option
                                key={item.id}
                                value={item.id}
                            >
                                {item.grade_name}
                            </option>

                        ))}

                    </select>

                </div>

                {/* Career Level */}

                <div>

                    <label className="mb-2 block text-sm font-semibold">
                        Career Level
                    </label>

                    <select
                        value={form.career_level || ""}
                        onChange={(e)=>
                            handleChange(
                                "career_level",
                                e.target.value
                            )
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    >

                        <option value="">
                            All Career Levels
                        </option>

                        <option value="staff">
                            Staff
                        </option>

                        <option value="senior">
                            Senior
                        </option>

                        <option value="specialist">
                            Specialist
                        </option>

                        <option value="supervisor">
                            Supervisor
                        </option>

                        <option value="manager">
                            Manager
                        </option>

                        <option value="director">
                            Director
                        </option>

                        <option value="executive">
                            Executive
                        </option>

                    </select>

                </div>

                {/* Job Family */}

                <div>

                    <label className="mb-2 block text-sm font-semibold">
                        Job Family
                    </label>

                    <input
                        type="text"
                        value={form.job_family || ""}
                        placeholder="IT, Finance, HR..."
                        onChange={(e)=>
                            handleChange(
                                "job_family",
                                e.target.value
                            )
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    />

                </div>


                {/* ========================================== */}
                {/* Employment Conditions */}
                {/* ========================================== */}

                <div className="lg:col-span-2">

                    <div className="my-2 border-t border-slate-200 pt-6">

                        <h4 className="text-base font-bold text-slate-800">
                            Employment Conditions
                        </h4>

                        <p className="mt-1 text-sm text-slate-500">
                            กำหนดเงื่อนไขเพิ่มเติมของพนักงานที่สามารถใช้ Policy นี้
                        </p>

                    </div>

                </div>

                {/* Minimum Service Year */}

                <div>

                    <label className="mb-2 block text-sm font-semibold">
                        Minimum Service (Years)
                    </label>

                    <input
                        type="number"
                        min="0"
                        value={form.min_service_year || ""}
                        onChange={(e)=>
                            handleChange(
                                "min_service_year",
                                e.target.value
                            )
                        }
                        placeholder="0"
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    />

                </div>

                {/* Maximum Service Year */}

                <div>

                    <label className="mb-2 block text-sm font-semibold">
                        Maximum Service (Years)
                    </label>

                    <input
                        type="number"
                        min="0"
                        value={form.max_service_year || ""}
                        onChange={(e)=>
                            handleChange(
                                "max_service_year",
                                e.target.value
                            )
                        }
                        placeholder="Unlimited"
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    />

                </div>

                {/* Minimum Age */}

                <div>

                    <label className="mb-2 block text-sm font-semibold">
                        Minimum Age
                    </label>

                    <input
                        type="number"
                        min="18"
                        value={form.min_age || ""}
                        onChange={(e)=>
                            handleChange(
                                "min_age",
                                e.target.value
                            )
                        }
                        placeholder="18"
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    />

                </div>

                {/* Maximum Age */}

                <div>

                    <label className="mb-2 block text-sm font-semibold">
                        Maximum Age
                    </label>

                    <input
                        type="number"
                        min="18"
                        value={form.max_age || ""}
                        onChange={(e)=>
                            handleChange(
                                "max_age",
                                e.target.value
                            )
                        }
                        placeholder="60"
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    />

                </div>

                {/* Probation */}

                <div>

                    <label className="mb-2 block text-sm font-semibold">
                        Probation
                    </label>

                    <select
                        value={form.probation_status || ""}
                        onChange={(e)=>
                            handleChange(
                                "probation_status",
                                e.target.value
                            )
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    >

                        <option value="">
                            All Employees
                        </option>

                        <option value="yes">
                            Only Probation
                        </option>

                        <option value="no">
                            Exclude Probation
                        </option>

                    </select>

                </div>

                {/* Contract Type */}

                <div>

                    <label className="mb-2 block text-sm font-semibold">
                        Contract Type
                    </label>

                    <select
                        value={form.contract_type || ""}
                        onChange={(e)=>
                            handleChange(
                                "contract_type",
                                e.target.value
                            )
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    >

                        <option value="">
                            All Contract Types
                        </option>

                        <option value="permanent">
                            Permanent
                        </option>

                        <option value="fixed_term">
                            Fixed Term
                        </option>

                        <option value="temporary">
                            Temporary
                        </option>

                        <option value="project">
                            Project
                        </option>

                    </select>

                </div>

                {/* Work Type */}

                <div>

                    <label className="mb-2 block text-sm font-semibold">
                        Work Type
                    </label>

                    <select
                        value={form.work_type || ""}
                        onChange={(e)=>
                            handleChange(
                                "work_type",
                                e.target.value
                            )
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    >

                        <option value="">
                            All Work Types
                        </option>

                        <option value="full_time">
                            Full Time
                        </option>

                        <option value="part_time">
                            Part Time
                        </option>

                        <option value="freelance">
                            Freelance
                        </option>

                    </select>

                </div>

                {/* Shift */}

                <div>

                    <label className="mb-2 block text-sm font-semibold">
                        Shift
                    </label>

                    <input
                        type="text"
                        value={form.shift_name || ""}
                        placeholder="Day Shift / Night Shift"
                        onChange={(e)=>
                            handleChange(
                                "shift_name",
                                e.target.value
                            )
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    />

                </div>

                {/* Work Location */}

                <div className="lg:col-span-2">

                    <label className="mb-2 block text-sm font-semibold">
                        Work Location
                    </label>

                    <input
                        type="text"
                        value={form.work_location || ""}
                        placeholder="สำนักงานใหญ่, Phuket Office, Bangkok Office"
                        onChange={(e)=>
                            handleChange(
                                "work_location",
                                e.target.value
                            )
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    />

                </div>


                {/* ========================================== */}
                {/* Scope Preview */}
                {/* ========================================== */}

                <div className="lg:col-span-2">

                    <div className="my-2 border-t border-slate-200 pt-6">

                        <h4 className="text-base font-bold text-slate-800">
                            Scope Preview
                        </h4>

                        <p className="mt-1 text-sm text-slate-500">
                            สรุปขอบเขตของพนักงานที่นโยบายนี้จะมีผลบังคับใช้
                        </p>

                    </div>

                </div>

                <div className="lg:col-span-2">

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                            <PreviewItem
                                label="Company"
                                value={
                                    companies.find(
                                        x => x.id === form.company_id
                                    )?.company_name_th || "All Companies"
                                }
                            />

                            <PreviewItem
                                label="Branch"
                                value={
                                    branches.find(
                                        x => x.id === form.branch_id
                                    )?.branch_name || "All Branches"
                                }
                            />

                            <PreviewItem
                                label="Department"
                                value={
                                    departments.find(
                                        x => x.id === form.department_id
                                    )?.department_name || "All Departments"
                                }
                            />

                            <PreviewItem
                                label="Division"
                                value={
                                    divisions.find(
                                        x => x.id === form.division_id
                                    )?.division_name || "All Divisions"
                                }
                            />

                            <PreviewItem
                                label="Unit"
                                value={
                                    units.find(
                                        x => x.id === form.unit_id
                                    )?.unit_name || "All Units"
                                }
                            />

                            <PreviewItem
                                label="Position"
                                value={
                                    positions.find(
                                        x => x.id === form.position_id
                                    )?.position_name || "All Positions"
                                }
                            />

                            <PreviewItem
                                label="Employment Type"
                                value={
                                    form.employment_type || "All"
                                }
                            />

                            <PreviewItem
                                label="Employee Status"
                                value={
                                    form.employee_status || "All"
                                }
                            />

                            <PreviewItem
                                label="Position Group"
                                value={
                                    form.position_group || "All"
                                }
                            />

                            <PreviewItem
                                label="Career Level"
                                value={
                                    form.career_level || "All"
                                }
                            />

                            <PreviewItem
                                label="Minimum Service"
                                value={
                                    form.min_service_year
                                        ? `${form.min_service_year} Years`
                                        : "-"
                                }
                            />

                            <PreviewItem
                                label="Probation"
                                value={
                                    form.probation_status || "All"
                                }
                            />

                        </div>

                    </div>

                </div>

                {/* ========================================== */}
                {/* Validation */}
                {/* ========================================== */}

                <div className="lg:col-span-2">

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">

                        <h4 className="font-bold text-amber-700">
                            Validation
                        </h4>

                        <ul className="mt-4 space-y-2 text-sm">

                            {!form.company_id && (
                                <li className="text-amber-700">
                                    • Policy จะมีผลกับทุก Company
                                </li>
                            )}

                            {!form.branch_id && (
                                <li className="text-amber-700">
                                    • Policy จะมีผลกับทุก Branch
                                </li>
                            )}

                            {!form.position_group && (
                                <li className="text-amber-700">
                                    • ยังไม่ได้กำหนด Position Group
                                </li>
                            )}

                            {!form.employment_type && (
                                <li className="text-amber-700">
                                    • ครอบคลุมพนักงานทุกประเภท
                                </li>
                            )}

                            {form.company_id &&
                                form.position_group && (
                                    <li className="text-green-700">
                                        ✓ Scope พร้อมใช้งาน
                                    </li>
                                )}

                        </ul>

                    </div>

                </div>

              </div>
          </FormSection>
            
        </div>
    );

}