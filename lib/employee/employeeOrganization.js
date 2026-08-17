import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================================================
   RESPONSE HELPERS
========================================================= */

function success(data = {}) {
  return {
    success: true,
    data,
    message: null,
  };
}

function failure(
  message,
  error = null
) {
  return {
    success: false,
    data: null,
    message,
    error,
  };
}

/* =========================================================
   VALIDATE ORGANIZATION
========================================================= */

export async function validateEmployeeOrganization(
  employee
) {
  try {
    /* -----------------------------------------------------
       Company
    ----------------------------------------------------- */

    const {
      data: company,
      error: companyError,
    } = await supabaseAdmin
      .from("companies")
      .select(
        `
          id,
          company_code,
          company_name_th,
          company_name_en,
          status
        `
      )
      .eq(
        "id",
        employee.company_id
      )
      .maybeSingle();

    if (companyError) {
      return failure(
        "ไม่สามารถตรวจสอบบริษัทได้",
        companyError
      );
    }

    if (!company) {
      return failure(
        "ไม่พบบริษัทที่เลือก"
      );
    }

    if (
      company.status !== "active"
    ) {
      return failure(
        "บริษัทที่เลือกไม่ได้เปิดใช้งาน"
      );
    }

    /* -----------------------------------------------------
       Branch
    ----------------------------------------------------- */

    const {
      data: branch,
      error: branchError,
    } = await supabaseAdmin
      .from("branches")
      .select(
        `
          id,
          company_id,
          branch_code,
          branch_name,
          status
        `
      )
      .eq(
        "id",
        employee.branch_id
      )
      .maybeSingle();

    if (branchError) {
      return failure(
        "ไม่สามารถตรวจสอบสังกัดได้",
        branchError
      );
    }

    if (!branch) {
      return failure(
        "ไม่พบสังกัดที่เลือก"
      );
    }

    if (
      branch.company_id !==
      employee.company_id
    ) {
      return failure(
        "สังกัดไม่ได้อยู่ในบริษัทที่เลือก"
      );
    }

    if (
      branch.status !== "active"
    ) {
      return failure(
        "สังกัดที่เลือกไม่ได้เปิดใช้งาน"
      );
    }

    /* -----------------------------------------------------
       Branch group
    ----------------------------------------------------- */

    let branchGroup = null;

    if (employee.branch_group_id) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .from("branch_groups")
        .select(
          `
            id,
            group_code,
            group_name,
            status
          `
        )
        .eq(
          "id",
          employee.branch_group_id
        )
        .maybeSingle();

      if (error) {
        return failure(
          "ไม่สามารถตรวจสอบกรุ๊ปสังกัดได้",
          error
        );
      }

      if (!data) {
        return failure(
          "ไม่พบกรุ๊ปสังกัดที่เลือก"
        );
      }

      if (
        data.status !== "active"
      ) {
        return failure(
          "กรุ๊ปสังกัดไม่ได้เปิดใช้งาน"
        );
      }

      branchGroup = data;
    }

    /* -----------------------------------------------------
       Department
    ----------------------------------------------------- */

    const {
      data: department,
      error: departmentError,
    } = await supabaseAdmin
      .from("departments")
      .select(
        `
          id,
          department_code,
          department_name,
          status
        `
      )
      .eq(
        "id",
        employee.department_id
      )
      .maybeSingle();

    if (departmentError) {
      return failure(
        "ไม่สามารถตรวจสอบแผนกได้",
        departmentError
      );
    }

    if (!department) {
      return failure(
        "ไม่พบแผนกที่เลือก"
      );
    }

    if (
      department.status !==
      "active"
    ) {
      return failure(
        "แผนกที่เลือกไม่ได้เปิดใช้งาน"
      );
    }

    /*
      ตรวจว่าแผนกถูกผูกกับสังกัด
    */

    const {
      data: branchDepartment,
      error: mappingError,
    } = await supabaseAdmin
      .from("branch_departments")
      .select("id, status")
      .eq(
        "branch_id",
        employee.branch_id
      )
      .eq(
        "department_id",
        employee.department_id
      )
      .maybeSingle();

    if (mappingError) {
      return failure(
        "ไม่สามารถตรวจสอบความสัมพันธ์ระหว่างสังกัดและแผนกได้",
        mappingError
      );
    }

    if (!branchDepartment) {
      return failure(
        "แผนกไม่ได้ถูกกำหนดให้กับสังกัดที่เลือก"
      );
    }

    if (
      branchDepartment.status &&
      branchDepartment.status !==
        "active"
    ) {
      return failure(
        "ความสัมพันธ์ระหว่างสังกัดและแผนกไม่ได้เปิดใช้งาน"
      );
    }

    /* -----------------------------------------------------
       Division
    ----------------------------------------------------- */

    let division = null;

    if (employee.division_id) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .from("divisions")
        .select(
          `
            id,
            department_id,
            division_code,
            division_name,
            status
          `
        )
        .eq(
          "id",
          employee.division_id
        )
        .maybeSingle();

      if (error) {
        return failure(
          "ไม่สามารถตรวจสอบฝ่ายได้",
          error
        );
      }

      if (!data) {
        return failure(
          "ไม่พบฝ่ายที่เลือก"
        );
      }

      if (
        data.department_id !==
        employee.department_id
      ) {
        return failure(
          "ฝ่ายไม่ได้อยู่ในแผนกที่เลือก"
        );
      }

      if (
        data.status !== "active"
      ) {
        return failure(
          "ฝ่ายที่เลือกไม่ได้เปิดใช้งาน"
        );
      }

      division = data;
    }

    /* -----------------------------------------------------
       Unit
    ----------------------------------------------------- */

    let unit = null;

    if (employee.unit_id) {
      if (!employee.division_id) {
        return failure(
          "กรุณาเลือกฝ่ายก่อนเลือกหน่วยงาน"
        );
      }

      const {
        data,
        error,
      } = await supabaseAdmin
        .from("units")
        .select(
          `
            id,
            division_id,
            unit_code,
            unit_name,
            status
          `
        )
        .eq(
          "id",
          employee.unit_id
        )
        .maybeSingle();

      if (error) {
        return failure(
          "ไม่สามารถตรวจสอบหน่วยงานได้",
          error
        );
      }

      if (!data) {
        return failure(
          "ไม่พบหน่วยงานที่เลือก"
        );
      }

      if (
        data.division_id !==
        employee.division_id
      ) {
        return failure(
          "หน่วยงานไม่ได้อยู่ในฝ่ายที่เลือก"
        );
      }

      if (
        data.status !== "active"
      ) {
        return failure(
          "หน่วยงานที่เลือกไม่ได้เปิดใช้งาน"
        );
      }

      unit = data;
    }

    /* -----------------------------------------------------
       Position
    ----------------------------------------------------- */

    const {
      data: position,
      error: positionError,
    } = await supabaseAdmin
      .from("positions")
      .select(
        `
          id,
          position_code,
          position_name,
          position_family_id,
          status
        `
      )
      .eq(
        "id",
        employee.position_id
      )
      .maybeSingle();

    if (positionError) {
      return failure(
        "ไม่สามารถตรวจสอบตำแหน่งได้",
        positionError
      );
    }

    if (!position) {
      return failure(
        "ไม่พบตำแหน่งที่เลือก"
      );
    }

    if (
      position.status !==
      "active"
    ) {
      return failure(
        "ตำแหน่งที่เลือกไม่ได้เปิดใช้งาน"
      );
    }

    /*
      หากเลือก Unit ให้ตรวจ unit_positions
    */

    if (employee.unit_id) {
      const {
        data: unitPosition,
        error: unitPositionError,
      } = await supabaseAdmin
        .from("unit_positions")
        .select("id, status")
        .eq(
          "unit_id",
          employee.unit_id
        )
        .eq(
          "position_id",
          employee.position_id
        )
        .maybeSingle();

      if (unitPositionError) {
        return failure(
          "ไม่สามารถตรวจสอบตำแหน่งตามหน่วยงานได้",
          unitPositionError
        );
      }

      if (!unitPosition) {
        return failure(
          "ตำแหน่งไม่ได้ถูกกำหนดให้กับหน่วยงานที่เลือก"
        );
      }

      if (
        unitPosition.status &&
        unitPosition.status !==
          "active"
      ) {
        return failure(
          "ตำแหน่งตามหน่วยงานไม่ได้เปิดใช้งาน"
        );
      }
    }

    /* -----------------------------------------------------
       Job
    ----------------------------------------------------- */

    let job = null;

    if (employee.job_id) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .from("jobs")
        .select(
          `
            id,
            job_code,
            job_name,
            status
          `
        )
        .eq(
          "id",
          employee.job_id
        )
        .maybeSingle();

      if (error) {
        return failure(
          "ไม่สามารถตรวจสอบบทบาทงานได้",
          error
        );
      }

      if (!data) {
        return failure(
          "ไม่พบบทบาทงานที่เลือก"
        );
      }

      if (
        data.status !== "active"
      ) {
        return failure(
          "บทบาทงานที่เลือกไม่ได้เปิดใช้งาน"
        );
      }

      job = data;
    }

    return success({
      company,
      branchGroup,
      branch,
      department,
      division,
      unit,
      position,
      job,
    });
  } catch (error) {
    console.error(
      "validateEmployeeOrganization exception:",
      error
    );

    return failure(
      "เกิดข้อผิดพลาดในการตรวจสอบโครงสร้างองค์กร",
      error
    );
  }
}